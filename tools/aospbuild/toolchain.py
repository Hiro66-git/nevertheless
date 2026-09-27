"""Toolchain path resolution for the Aegis offline build.

The offline build verifies the Aegis sources with a real toolchain assembled
from public mirrors (AOSP prebuilts mirrored by msft-mirror-aosp, the official
BouncyCastle repository, and jspecify). Nothing in this file modifies the
project; it only locates tools.

Toolchain layout (see tools/aospbuild/fetch-toolchain.sh):

  $AEGIS_TC/
    jdk17/linux-x86/          OpenJDK 17 (AOSP prebuilts)
    kotlinc/                  Kotlin 2.0.21 dist + compose-compiler plugin (AOSP)
    sdk/current/public/       android.jar of the current AOSP SDK
    sdk/35/public/            android.jar of SDK 35
    sdk/tools/linux/bin|lib   aapt2, zipalign, d8.jar, apksigner.jar
    sdk/current/androidx/m2repository/   androidx artifacts (single pinned versions)
    tools/common/m2/repository/          miscellaneous maven artifacts (guava, ...)
    r8/r8.jar                 R8/D8 compiler
    bc-java/core/src/main/java  BouncyCastle 1.77 sources (Argon2id)
    junit/, hamcrest/         junit4 + hamcrest-core sources
    libs/                     compiled helper jars (bcprov, junit, hamcrest, jspecify)
    build/                    scratch space
"""

from __future__ import annotations

import os
from pathlib import Path


def toolchain_root() -> Path:
    root = os.environ.get("AEGIS_TC")
    if root:
        return Path(root)
    default = Path("/opt/aegis-tc")
    if default.is_dir():
        return default
    raise SystemExit(
        "Aegis toolchain not found. Set AEGIS_TC or run "
        "tools/aospbuild/fetch-toolchain.sh first (see docs/BUILDING-OFFLINE.md)."
    )


class Toolchain:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or toolchain_root()
        self.java_home = self.root / "jdk17" / "linux-x86"
        self.kotlinc = self.root / "kotlinc" / "bin" / "kotlinc"
        self.kotlin_lib = self.root / "kotlinc" / "lib"
        self.android_jar = self.root / "sdk" / "current" / "public" / "android.jar"
        self.android_jar_35 = self.root / "sdk" / "35" / "public" / "android.jar"
        self.aapt2 = self.root / "sdk" / "tools" / "linux" / "bin" / "aapt2"
        self.zipalign = self.root / "sdk" / "tools" / "linux" / "bin" / "zipalign"
        self.d8_jar = self.root / "sdk" / "tools" / "linux" / "lib" / "d8.jar"
        self.r8_jar = self.root / "r8" / "r8.jar"
        self.apksigner_jar = self.root / "sdk" / "tools" / "linux" / "lib" / "apksigner.jar"
        self.maven_androidx = self.root / "sdk" / "current" / "androidx" / "m2repository"
        self.maven_tools = self.root / "tools" / "common" / "m2" / "repository"
        self.libs = self.root / "libs"
        self.work = self.root / "build"

        # Compiled from vendored sources during toolchain setup.
        self.bcprov_jar = self.libs / "bcprov.jar"
        self.junit_jar = self.libs / "junit.jar"
        self.hamcrest_jar = self.libs / "hamcrest-core.jar"
        self.jspecify_jar = self.libs / "jspecify.jar"
        self.compose_compiler_jar = (
            self.root
            / "compose-compiler"
            / "org"
            / "jetbrains"
            / "kotlin"
            / "kotlin-compose-compiler-plugin"
            / "2.0.21"
            / "kotlin-compose-compiler-plugin-2.0.21.jar"
        )
        self.kotlin_stdlib_jar = self.kotlin_lib / "kotlin-stdlib.jar"
        self.coroutines_jar = self.kotlin_lib / "kotlinx-coroutines-core-jvm.jar"
        self.kotlin_reflect_jar = self.kotlin_lib / "kotlin-reflect.jar"
        self.kotlin_test_jar = self.kotlin_lib / "kotlin-test.jar"
        self.kapt_jar = self.kotlin_lib / "kotlin-annotation-processing.jar"

    def java(self) -> str:
        return str(self.java_home / "bin" / "java")

    def javac(self) -> str:
        return str(self.java_home / "bin" / "javac")

    def keytool(self) -> str:
        return str(self.java_home / "bin" / "keytool")

    def validate(self) -> None:
        required = [
            self.java_home / "bin" / "java",
            self.kotlinc,
            self.android_jar,
            self.aapt2,
            self.zipalign,
            self.d8_jar,
            self.apksigner_jar,
            self.maven_androidx,
            self.bcprov_jar,
            self.junit_jar,
            self.compose_compiler_jar,
        ]
        missing = [str(p) for p in required if not p.exists()]
        if missing:
            raise SystemExit(
                "Incomplete toolchain; missing:\n  " + "\n  ".join(missing)
            )
