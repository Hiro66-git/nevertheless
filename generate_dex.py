import struct
import hashlib
import zlib

def make_uleb128(val):
    res = bytearray()
    while True:
        b = val & 0x7f
        val >>= 7
        if val != 0:
            b |= 0x80
            res.append(b)
        else:
            res.append(b)
            break
    return bytes(res)

def build_valid_dex():
    strings = [
        "<clinit>",
        "<init>",
        "Landroid/app/Activity;",
        "Landroid/app/Application;",
        "Lcom/ritu/calendar/MainActivity;",
        "Lcom/ritu/calendar/RituApplication;",
        "Ljava/lang/Object;",
        "MainActivity.java",
        "RituApplication.java",
        "V",
        "VL"
    ]
    strings.sort()

    type_strings = [
        "Landroid/app/Activity;",
        "Landroid/app/Application;",
        "Lcom/ritu/calendar/MainActivity;",
        "Lcom/ritu/calendar/RituApplication;",
        "Ljava/lang/Object;",
        "V"
    ]
    type_strings.sort()
    type_ids = [strings.index(ts) for ts in type_strings]

    proto_ids = [
        (strings.index("V"), type_strings.index("V"), 0)
    ]

    method_ids = [
        (type_strings.index("Landroid/app/Activity;"), 0, strings.index("<init>")),
        (type_strings.index("Landroid/app/Application;"), 0, strings.index("<init>")),
        (type_strings.index("Lcom/ritu/calendar/MainActivity;"), 0, strings.index("<init>")),
        (type_strings.index("Lcom/ritu/calendar/RituApplication;"), 0, strings.index("<init>"))
    ]

    string_data_offsets = []
    string_data_bytes = bytearray()
    for s in strings:
        string_data_offsets.append(len(string_data_bytes))
        string_data_bytes.extend(make_uleb128(len(s)))
        string_data_bytes.extend(s.encode('utf-8'))
        string_data_bytes.append(0)

    while len(string_data_bytes) % 4 != 0:
        string_data_bytes.append(0)

    header_size = 0x70

    num_strings = len(strings)
    num_types = len(type_ids)
    num_protos = len(proto_ids)
    num_methods = len(method_ids)
    num_classes = 2

    string_ids_off = header_size
    type_ids_off = string_ids_off + 4 * num_strings
    proto_ids_off = type_ids_off + 4 * num_types
    field_ids_off = 0
    method_ids_off = proto_ids_off + 12 * num_protos
    class_defs_off = method_ids_off + 8 * num_methods
    data_off = class_defs_off + 32 * num_classes

    string_ids_bytes = bytearray()
    for sdo in string_data_offsets:
        string_ids_bytes.extend(struct.pack('<I', data_off + sdo))

    type_ids_bytes = bytearray()
    for ti in type_ids:
        type_ids_bytes.extend(struct.pack('<I', ti))

    proto_ids_bytes = bytearray()
    for shorty_idx, ret_idx, params_off in proto_ids:
        proto_ids_bytes.extend(struct.pack('<III', shorty_idx, ret_idx, params_off))

    method_ids_bytes = bytearray()
    for cls_idx, pr_idx, nm_idx in method_ids:
        method_ids_bytes.extend(struct.pack('<HHI', cls_idx, pr_idx, nm_idx))

    class_defs_bytes = bytearray()
    
    # RituApplication
    class_defs_bytes.extend(struct.pack(
        '<IIIIIIII',
        type_strings.index("Lcom/ritu/calendar/RituApplication;"),
        0x0001,
        type_strings.index("Landroid/app/Application;"),
        0,
        strings.index("RituApplication.java"),
        0,
        0,
        0
    ))
    
    # MainActivity
    class_defs_bytes.extend(struct.pack(
        '<IIIIIIII',
        type_strings.index("Lcom/ritu/calendar/MainActivity;"),
        0x0001,
        type_strings.index("Landroid/app/Activity;"),
        0,
        strings.index("MainActivity.java"),
        0,
        0,
        0
    ))

    data_section = bytearray(string_data_bytes)
    map_off = data_off + len(data_section)
    
    map_items = [
        (0x0000, 1, 0),
        (0x0001, num_strings, string_ids_off),
        (0x0002, num_types, type_ids_off),
        (0x0003, num_protos, proto_ids_off),
        (0x0005, num_methods, method_ids_off),
        (0x0006, num_classes, class_defs_off),
        (0x2002, num_strings, data_off),
        (0x1000, 1, map_off)
    ]
    
    map_bytes = struct.pack('<I', len(map_items))
    for mtype, msize, moff in map_items:
        map_bytes += struct.pack('<HHI', mtype, 0, msize) + struct.pack('<I', moff)
        
    data_section.extend(map_bytes)
    while len(data_section) % 4 != 0:
        data_section.append(0)

    data_size = len(data_section)
    file_size = data_off + data_size

    magic = b"dex\n035\x00"
    endian_tag = 0x12345678

    header_body = struct.pack(
        "<20I",
        file_size, header_size, endian_tag,
        0, 0,
        map_off,
        num_strings, string_ids_off,
        num_types, type_ids_off,
        num_protos, proto_ids_off,
        0, 0,
        num_methods, method_ids_off,
        num_classes, class_defs_off,
        data_size, data_off
    )

    full_content_wo_sig = (
        header_body +
        string_ids_bytes +
        type_ids_bytes +
        proto_ids_bytes +
        method_ids_bytes +
        class_defs_bytes +
        data_section
    )

    sig = hashlib.sha1(full_content_wo_sig).digest()
    temp_with_sig = magic + struct.pack("<I", 0) + sig + full_content_wo_sig
    adler = zlib.adler32(temp_with_sig[12:]) & 0xffffffff

    final_dex = magic + struct.pack("<I", adler) + sig + full_content_wo_sig
    return final_dex

if __name__ == "__main__":
    dex = build_valid_dex()
    with open("/tmp/classes.dex", "wb") as f:
        f.write(dex)
    print(f"Generated DEX: {len(dex)} bytes, magic={dex[:8]}")
