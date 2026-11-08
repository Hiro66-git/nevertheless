#!/usr/bin/env node
/**
 * Build the distributable zip.
 *
 * The app is designed to be unzipped and run with `./start.sh` (or `start.cmd`),
 * so the archive contains source only — no node_modules, no caches, no clones.
 * The two optional packages for social cards are installed by the launcher on
 * first run.
 *
 * Usage
 *   node tools/build-zip.mjs                 # -> dist/quiet-archive-app.zip
 *   node tools/build-zip.mjs --with-deps     # include node_modules (offline install)
 *   node tools/build-zip.mjs --out /tmp/qa.zip
 */

import { createWriteStream } from 'node:fs';
import { readdir, stat, mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const next = argv[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

const OUT = path.resolve(String(flag('out', path.join(APP_ROOT, 'dist/quiet-archive-app.zip'))));
const WITH_DEPS = Boolean(flag('with-deps', false));
const ALWAYS_EXCLUDE = new Set([
  '.git', '.cache', 'node_modules', 'dist', 'projects', '.DS_Store', '.og-preview',
]);
const WITH_DEPS_EXCLUDE = new Set(['.git', '.cache', 'dist', 'projects', '.DS_Store']);

/* ------------------------------------------------------------ zip writing */

/**
 * Minimal ZIP writer (deflate + store). No dependency, deterministic output:
 * a fixed mtime and sorted entries mean two builds of the same source produce
 * byte-identical archives, which matters if you want to publish checksums.
 */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i += 1) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

const FIXED_MTIME = 0x0000; // 00:00:00 on the DOS epoch date used below
const FIXED_DATE = 0x5a21; // 2026-01-01 (DOS: year-1980=46)

function localHeader({ name, crc, size, compressed, method }) {
  const nameBuf = Buffer.from(name, 'utf8');
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0);
  head.writeUInt16LE(20, 4); // version needed
  head.writeUInt16LE(0x0800, 6); // UTF-8 names
  head.writeUInt16LE(method, 8);
  head.writeUInt16LE(FIXED_MTIME, 10);
  head.writeUInt16LE(FIXED_DATE, 12);
  head.writeUInt32LE(crc, 14);
  head.writeUInt32LE(compressed, 18);
  head.writeUInt32LE(size, 22);
  head.writeUInt16LE(nameBuf.length, 26);
  head.writeUInt16LE(0, 28);
  return Buffer.concat([head, nameBuf]);
}

function centralHeader({ name, crc, size, compressed, method, offset, external }) {
  const nameBuf = Buffer.from(name, 'utf8');
  const head = Buffer.alloc(46);
  head.writeUInt32LE(0x02014b50, 0);
  head.writeUInt16LE(0x031e, 4); // made by: unix, zip 3.0
  head.writeUInt16LE(20, 6);
  head.writeUInt16LE(0x0800, 8);
  head.writeUInt16LE(method, 10);
  head.writeUInt16LE(FIXED_MTIME, 12);
  head.writeUInt16LE(FIXED_DATE, 14);
  head.writeUInt32LE(crc, 16);
  head.writeUInt32LE(compressed, 20);
  head.writeUInt32LE(size, 24);
  head.writeUInt16LE(nameBuf.length, 28);
  head.writeUInt16LE(0, 30); // extra
  head.writeUInt16LE(0, 32); // comment
  head.writeUInt16LE(0, 34); // disk
  head.writeUInt16LE(0, 36); // internal attrs
  head.writeUInt32LE(external >>> 0, 38); // unix mode << 16
  head.writeUInt32LE(offset, 42);
  return Buffer.concat([head, nameBuf]);
}

/* -------------------------------------------------------------- collection */

async function collect(dir, base = '', exclude = ALWAYS_EXCLUDE, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await collect(abs, rel, exclude, out);
    } else if (entry.isFile()) {
      const s = await stat(abs);
      out.push({ abs, rel, size: s.size });
    }
  }
  return out;
}

/* ------------------------------------------------------------------- main */

const exclude = WITH_DEPS ? WITH_DEPS_EXCLUDE : ALWAYS_EXCLUDE;
const files = (await collect(APP_ROOT, '', exclude)).sort((a, b) => a.rel.localeCompare(b.rel));

await mkdir(path.dirname(OUT), { recursive: true });
const stream = createWriteStream(OUT);

let offset = 0;
const central = [];
const written = { deflated: 0, stored: 0, bytesIn: 0, bytesOut: 0 };

for (const file of files) {
  const data = await readFile(file.abs);
  const deflated = deflateRawSync(data, { level: 9 });
  // Never inflate a file that does not compress; PDFs and PNGs are already dense.
  const useDeflate = deflated.length < data.length;
  const payload = useDeflate ? deflated : data;
  const method = useDeflate ? 8 : 0;
  const isExecutable = /\.(sh|mjs)$/.test(file.rel) || file.rel === 'start.sh';
  const external = ((isExecutable ? 0o100755 : 0o100644) << 16) >>> 0;

  const entry = {
    name: file.rel,
    crc: crc32(data),
    size: data.length,
    compressed: payload.length,
    method,
    offset,
    external,
  };

  const header = localHeader(entry);
  stream.write(header);
  stream.write(payload);
  offset += header.length + payload.length;
  central.push(entry);

  written.bytesIn += data.length;
  written.bytesOut += payload.length;
  written[useDeflate ? 'deflated' : 'stored'] += 1;
}

const centralStart = offset;
let centralSize = 0;
for (const entry of central) {
  const buf = centralHeader(entry);
  stream.write(buf);
  centralSize += buf.length;
}

const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(central.length, 8);
end.writeUInt16LE(central.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(centralStart, 16);
end.writeUInt16LE(0, 20);
stream.write(end);

await new Promise((resolve, reject) => {
  stream.end(resolve);
  stream.on('error', reject);
});

const total = (await stat(OUT)).size;
const rel = path.relative(process.cwd(), OUT);

console.log(`\n  ${rel}`);
console.log(`  ${files.length} files · ${(total / 1024 / 1024).toFixed(2)} MB`);
console.log(`  ${written.deflated} deflated, ${written.stored} stored`);
console.log(`  text ${(written.bytesIn / 1024).toFixed(0)} KB -> ${(written.bytesOut / 1024).toFixed(0)} KB before headers`);

if (WITH_DEPS) {
  console.log('\n  Includes node_modules: social cards work offline out of the box.');
} else {
  console.log('\n  Source only. The launcher installs the optional card renderer on first run.');
  if (!existsSync(path.join(APP_ROOT, 'fonts', 'Inter-Regular.ttf'))) {
    console.warn('  !! fonts/ is missing Inter; cards will need a download on first render.');
  }
}
console.log('');
