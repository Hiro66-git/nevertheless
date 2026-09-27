"""Minimal Maven-style dependency resolver for the Aegis offline build.

The AOSP prebuilt mirrors used by this project expose standard Maven repository
layouts on disk:

    <repo>/<group path>/<artifact>/<version>/<artifact>-<version>.{pom,aar,jar}

Each mirrored androidx artifact exists at exactly one version (the version
pinned by AOSP at the time the mirror was captured), so the resolver follows
POM dependency declarations but falls back to "the available version" whenever
a POM requests a version that is not present. This mirrors how Gradle would
resolve the same graph against maven.google.com, except that the AOSP-pinned
version wins when the requested one is absent.

AARs are unpacked once into a scratch directory; their classes.jar and res/
directory are then used like any other classpath/resource entry.
"""

from __future__ import annotations

import json
import shutil
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass, field
from pathlib import Path


# Artifacts whose names match any of these substrings are excluded from the
# automatic transitive closure. They are lint rule sets, sample bundles,
# test-only helpers, or IDE tooling that never belongs on the compile
# classpath of the app.
EXCLUDE_SUBSTRINGS = (
    "-lint",
    "lint-",
    "-samples",
    "ui-test",
    "-accessibility",
    "ui-tooling",
    "-sources",
    "-ktx-darwin",
    "kotlin-annotations-jvm",
    "-desktop",
    "-macos",
    "-linuxx64",
    "-linuxarm64",
    "-ios",
    "-js",
    "-wasm",
    "-common",
)

EXCLUDED_GROUPS = {
    # Build-time only; never needed on the app classpath.
    "com.android.tools",
    "com.google.devtools.ksp",
}


@dataclass
class Artifact:
    group: str
    name: str
    version: str
    pom: Path | None
    jar: Path | None  # maven jar OR unpacked aar classes.jar

    aar: Path | None = None
    res_dir: Path | None = None

    @property
    def coordinate(self) -> str:
        return f"{self.group}:{self.name}:{self.version}"


class DirectoryRepo:
    """A repository stored in standard maven layout on disk."""

    def __init__(self, root: Path, name: str) -> None:
        self.root = root
        self.name = name

    def find(self, group: str, name: str, version: str | None) -> Artifact | None:
        # Multiplatform artifacts publish a root module (e.g. "ui") plus
        # platform variants ("ui-android", "ui-jvm"). The AOSP mirrors keep
        # only the platform variants, so fall back to those when the exact
        # artifact is absent.
        candidates = [name]
        for suffix in ("-android", "-jvm"):
            candidates.append(name + suffix)
        for candidate in candidates:
            art = self._find_exact(group, candidate, version)
            if art is not None:
                return art
        return None

    def _find_exact(self, group: str, name: str, version: str | None) -> Artifact | None:
        artifact_dir = self.root / group.replace(".", "/") / name
        if not artifact_dir.is_dir():
            return None
        versions = sorted(p.name for p in artifact_dir.iterdir() if p.is_dir())
        if not versions:
            return None
        chosen = version if version in versions else versions[-1]
        base = artifact_dir / chosen
        pom = base / f"{name}-{chosen}.pom"
        aar = base / f"{name}-{chosen}.aar"
        jar = base / f"{name}-{chosen}.jar"
        if not pom.exists() and not aar.exists() and not jar.exists():
            return None
        return Artifact(
            group=group,
            name=name,
            version=chosen,
            pom=pom if pom.exists() else None,
            jar=(jar if jar.exists() else None) or (aar if aar.exists() else None),
            aar=aar if aar.exists() else None,
        )


class FileRepo:
    """Serves a fixed set of jars built from vendored sources."""

    def __init__(self, entries: dict[tuple[str, str], tuple[Path, str]], name: str) -> None:
        # entries: (group, artifact) -> (jar path, version)
        self.entries = entries
        self.name = name

    def find(self, group: str, name: str, version: str | None) -> Artifact | None:
        hit = self.entries.get((group, name))
        if not hit:
            return None
        jar, ver = hit
        if version is not None and version != ver and not _version_close(version, ver):
            # Allow the request to fall back to our version.
            pass
        return Artifact(group=group, name=name, version=ver, pom=None, jar=jar)


def _version_close(requested: str, available: str) -> bool:
    return requested == available


def _excluded(group: str, name: str) -> bool:
    if group in EXCLUDED_GROUPS:
        return True
    return any(sub in name for sub in EXCLUDE_SUBSTRINGS)


class Resolver:
    def __init__(
        self,
        repos: list[DirectoryRepo | FileRepo],
        unpack_dir: Path,
        explicit: dict[tuple[str, str], str] | None = None,
    ) -> None:
        self.repos = repos
        self.unpack_dir = unpack_dir
        self.unpacked: dict[Path, Path] = {}
        # Version pins requested by the build (group, artifact) -> version.
        self.explicit = explicit or {}
        self.resolved: dict[tuple[str, str], Artifact] = {}

    def find(self, group: str, name: str, version: str | None = None) -> Artifact | None:
        version = self.explicit.get((group, name), version)
        for repo in self.repos:
            art = repo.find(group, name, version)
            if art:
                return art
        return None

    def pom_dependencies(self, art: Artifact) -> list[tuple[str, str, str]]:
        if not art.pom:
            return []
        try:
            root = ET.parse(art.pom).getroot()
        except ET.ParseError:
            return []
        # POMs use a default namespace; strip it so tag matching stays simple.
        for el in root.iter():
            if isinstance(el.tag, str) and el.tag.startswith("{"):
                el.tag = el.tag.split("}", 1)[1]
        deps: list[tuple[str, str, str]] = []
        for dep in root.iter("dependency"):
            g = dep.findtext("groupId")
            n = dep.findtext("artifactId")
            v = dep.findtext("version") or ""
            scope = (dep.findtext("scope") or "compile").strip()
            optional = (dep.findtext("optional") or "false").strip().lower() == "true"
            if scope not in ("compile", "runtime"):
                continue
            if optional:
                continue
            if not g or not n:
                continue
            deps.append((g, n, v))
        return deps

    def resolve(self, roots: list[tuple[str, str, str | None]]) -> list[Artifact]:
        queue: list[tuple[str, str, str | None]] = list(roots)
        seen: set[tuple[str, str]] = set()
        while queue:
            group, name, version = queue.pop(0)
            if (group, name) in seen:
                continue
            seen.add((group, name))
            if _excluded(group, name):
                continue
            art = self.find(group, name, version)
            if art is None:
                print(f"  ! unresolved: {group}:{name}:{version or '*'}")
                continue
            self.resolved[(group, name)] = art
            for g, n, v in self.pom_dependencies(art):
                if (g, n) not in seen:
                    queue.append((g, n, v))
        return list(self.resolved.values())

    def classes_of(self, art: Artifact) -> Path:
        """Return a jar with the artifact's classes, unpacking AARs on demand."""
        assert art.jar is not None
        if art.aar is None:
            return art.jar
        if art.aar in self.unpacked:
            return self.unpacked[art.aar] / "classes.jar"
        target = self.unpack_dir / f"{art.group.replace('.', '_')}_{art.name}"
        if not (target / "classes.jar").exists():
            target.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(art.aar) as zf:
                for member in zf.namelist():
                    if member == "classes.jar" or member.startswith("libs/"):
                        zf.extract(member, target)
                    elif member.startswith("res/"):
                        zf.extract(member, target)
            # libs/*.jar inside AARs are rare; flatten them into the record.
        self.unpacked[art.aar] = target
        return target / "classes.jar"

    def res_dirs(self) -> list[Path]:
        out = []
        for art in self.resolved.values():
            if art.aar is None:
                continue
            self.classes_of(art)  # ensure unpacked
            res = self.unpacked[art.aar] / "res"
            if res.is_dir() and any(res.iterdir()):
                out.append(res)
        return out

    def classpath(self) -> list[Path]:
        return [self.classes_of(a) for a in self.resolved.values()]
