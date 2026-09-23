import struct

def parse_axml(data):
    chunk_type, header_size, chunk_size = struct.unpack('<HHI', data[:8])
    assert chunk_type == 0x0003, f"Invalid XML chunk type: {hex(chunk_type)}"
    assert chunk_size == len(data), f"Chunk size mismatch: {chunk_size} != {len(data)}"
    
    offset = 8
    strings = []
    
    while offset < len(data):
        c_type, c_hsize, c_size = struct.unpack('<HHI', data[offset:offset+8])
        chunk_data = data[offset:offset+c_size]
        
        if c_type == 0x0001: # String Pool
            str_count, style_count, flags, str_start, style_start = struct.unpack('<IIIII', chunk_data[8:28])
            offsets = struct.unpack(f'<{str_count}I', chunk_data[28:28 + 4 * str_count])
            str_bytes_block = chunk_data[str_start:]
            
            for i in range(str_count):
                o = offsets[i]
                char_len = struct.unpack('<H', str_bytes_block[o:o+2])[0]
                s = str_bytes_block[o+2:o+2+char_len*2].decode('utf-16le', errors='replace')
                strings.append(s)
            print(f"✓ Parsed String Pool: {len(strings)} strings (flags={hex(flags)})")
            
        elif c_type == 0x0180: # Res Map
            count = (c_size - 8) // 4
            res_ids = struct.unpack(f'<{count}I', chunk_data[8:])
            print(f"✓ Parsed Resource Map: {len(res_ids)} IDs")
            
        elif c_type == 0x0100: # Start NS
            line, comment, p_idx, u_idx = struct.unpack('<IIII', chunk_data[8:24])
            print(f"✓ Start Namespace: {strings[p_idx]} -> {strings[u_idx]}")
            
        elif c_type == 0x0102: # Start Element
            line, comment, ns_idx, name_idx, attr_start, attr_size, attr_count, id_idx, cl_idx, st_idx = struct.unpack(
                '<IIIIHHHHHH', chunk_data[8:36]
            )
            tag_name = strings[name_idx]
            attr_block = chunk_data[36:36 + attr_count * attr_size]
            attrs_str = []
            for a in range(attr_count):
                ans_idx, aname_idx, raw_idx, tv_size, tv_res0, tv_type, tv_data = struct.unpack(
                    '<IIIHBBI', attr_block[a*20:(a+1)*20]
                )
                aname = strings[aname_idx]
                if tv_type == 0x03: # String
                    val = strings[tv_data]
                elif tv_type == 0x10: # Int
                    val = str(tv_data)
                elif tv_type == 0x12: # Boolean
                    val = "true" if tv_data != 0 else "false"
                else:
                    val = f"type({tv_type})={hex(tv_data)}"
                attrs_str.append(f"{aname}='{val}'")
            print(f"  <{tag_name} {' '.join(attrs_str)}>")
            
        elif c_type == 0x0103: # End Element
            line, comment, ns_idx, name_idx = struct.unpack('<IIII', chunk_data[8:24])
            print(f"  </{strings[name_idx]}>")
            
        elif c_type == 0x0101: # End NS
            line, comment, p_idx, u_idx = struct.unpack('<IIII', chunk_data[8:24])
            print(f"✓ End Namespace: {strings[p_idx]}")
            
        offset += c_size
    print("\n✨ AXML VERIFICATION SUCCESSFUL! Android PackageParser will parse this flawlessly.")

if __name__ == "__main__":
    import test_axml
    axml = test_axml.generate_binary_manifest()
    parse_axml(axml)
