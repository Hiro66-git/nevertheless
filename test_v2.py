import struct
import hashlib
import subprocess
import os

def compute_apk_v2_digest(zip_entries_bytes, cd_bytes, eocd_bytes, cd_offset):
    # EOCD with adjusted CD offset
    # EOCD format: (end of central dir signature 0x06054b50, disk num, disk start, entries on disk, total entries, cd size, cd offset, comment len)
    # CD offset is at bytes 16..20 of EOCD
    adjusted_eocd = bytearray(eocd_bytes)
    struct.pack_into("<I", adjusted_eocd, 16, cd_offset)

    # 1 MB = 1048576 bytes
    CHUNK_SIZE = 1048576

    def chunk_hashes(data):
        hashes = []
        for i in range(0, len(data), CHUNK_SIZE):
            chunk = data[i:i+CHUNK_SIZE]
            # prefix: 0xa5 (1 byte) + chunk_len (uint32)
            prefix = struct.pack("<BI", 0xa5, len(chunk))
            hashes.append(hashlib.sha256(prefix + chunk).digest())
        return hashes

    h1 = chunk_hashes(zip_entries_bytes)
    h2 = chunk_hashes(cd_bytes)
    h3 = chunk_hashes(bytes(adjusted_eocd))

    all_hashes = h1 + h2 + h3
    # Top-level digest: prefix 0x5a (1 byte) + num_chunks (uint32) + concatenated hashes
    top_prefix = struct.pack("<BI", 0x5a, len(all_hashes))
    top_digest = hashlib.sha256(top_prefix + b"".join(all_hashes)).digest()
    return top_digest

print("V2 digest computation logic defined.")
