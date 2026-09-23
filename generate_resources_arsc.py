import struct

def build_string_pool(strings):
    num_strings = len(strings)
    encoded_strings = []
    for s in strings:
        chars = s.encode('utf-16le')
        char_len = len(s)
        encoded_strings.append(struct.pack('<H', char_len) + chars + b'\x00\x00')

    offsets = []
    curr_offset = 0
    for es in encoded_strings:
        offsets.append(curr_offset)
        curr_offset += len(es)

    str_data = b''.join(encoded_strings)
    if len(str_data) % 4 != 0:
        str_data += b'\x00' * (4 - (len(str_data) % 4))

    header_size = 28
    strings_start = header_size + 4 * num_strings
    chunk_size = strings_start + len(str_data)

    header = struct.pack(
        '<HHIIIIII',
        0x0001,
        header_size,
        chunk_size,
        num_strings,
        0,
        0x00000000,
        strings_start,
        0
    )

    offsets_data = struct.pack(f'<{num_strings}I', *offsets)
    return header + offsets_data + str_data

def build_resources_arsc():
    global_strings = [
        "Ritu",
        "The Living Calendar of Seasons, Festivals & Life",
        "res/mipmap-anydpi-v26/ic_launcher.xml"
    ]
    global_sp = build_string_pool(global_strings)

    type_strings = ["string", "mipmap"]
    type_sp = build_string_pool(type_strings)

    key_strings = ["app_name", "app_tagline", "ic_launcher"]
    key_sp = build_string_pool(key_strings)

    pkg_id = 0x7F
    pkg_name_chars = "com.ritu.calendar".encode('utf-16le')
    pkg_name_field = pkg_name_chars.ljust(256, b'\x00')

    type_strings_off = 284
    key_strings_off = type_strings_off + len(type_sp)
    
    # ResTable_typeSpec (16 bytes header + 2 * 4 bytes flags = 24 bytes)
    type_spec_string = struct.pack(
        '<HHIBBHIII',
        0x0202, # RES_TABLE_TYPE_SPEC_TYPE
        16,     # header_size
        16 + 4 * 2, # chunk_size
        1,      # id (1-based)
        0,      # res0
        0,      # res1
        2,      # entryCount
        0, 0    # flags for entry 0, 1
    )

    # ResTable_type (16 bytes header + 64 bytes config = 80 bytes header)
    empty_config = b'\x00' * 64
    entry_0 = struct.pack('<HHIHBBI', 8, 0, 0, 8, 0, 3, 0)
    entry_1 = struct.pack('<HHIHBBI', 8, 0, 1, 8, 0, 3, 1)
    
    entries_offsets = struct.pack('<2I', 0, 16)
    type_chunk_size = 80 + len(entries_offsets) + len(entry_0) + len(entry_1)
    entries_start = 80 + len(entries_offsets)
    
    type_string_chunk = struct.pack(
        '<HHIBBHII',
        0x0201, # RES_TABLE_TYPE_TYPE
        80,     # header_size
        type_chunk_size,
        1,      # id = 1 ("string")
        0,      # res0
        0,      # res1
        2,      # entryCount
        entries_start
    ) + empty_config + entries_offsets + entry_0 + entry_1

    pkg_payload = type_sp + key_sp + type_spec_string + type_string_chunk
    pkg_chunk_size = 284 + len(pkg_payload)

    pkg_header = struct.pack(
        '<HHI I',
        0x0200, # RES_TABLE_PACKAGE_TYPE
        284,    # header_size
        pkg_chunk_size,
        pkg_id
    ) + pkg_name_field + struct.pack(
        '<IIII',
        type_strings_off,
        len(type_strings),
        key_strings_off,
        len(key_strings)
    )

    pkg_chunk = pkg_header + pkg_payload

    table_payload = global_sp + pkg_chunk
    table_chunk_size = 12 + len(table_payload)

    table_header = struct.pack(
        '<HHI I',
        0x0002,
        12,
        table_chunk_size,
        1
    )

    return table_header + table_payload

if __name__ == "__main__":
    arsc = build_resources_arsc()
    with open("/tmp/resources.arsc", "wb") as f:
        f.write(arsc)
    print(f"Generated resources.arsc: {len(arsc)} bytes, magic={arsc[:4]}")
