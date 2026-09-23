import struct

class AxmlEncoder:
    def __init__(self):
        self.strings = []
        self.string_to_idx = {}
        self.res_ids = []

    def add_string(self, s, res_id=None):
        if s in self.string_to_idx:
            idx = self.string_to_idx[s]
            if res_id is not None:
                while len(self.res_ids) <= idx:
                    self.res_ids.append(0)
                self.res_ids[idx] = res_id
            return idx
        idx = len(self.strings)
        self.strings.append(s)
        self.string_to_idx[s] = idx
        if res_id is not None:
            while len(self.res_ids) <= idx:
                self.res_ids.append(0)
            self.res_ids[idx] = res_id
        return idx

    def build_string_pool(self):
        num_strings = len(self.strings)
        encoded_strings = []
        for s in self.strings:
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

    def build_res_map(self):
        if not self.res_ids:
            return b''
        count = len(self.res_ids)
        chunk_size = 8 + 4 * count
        header = struct.pack('<HHI', 0x0180, 8, chunk_size)
        data = struct.pack(f'<{count}I', *self.res_ids)
        return header + data

    def start_ns(self, prefix, uri):
        p_idx = self.add_string(prefix)
        u_idx = self.add_string(uri)
        return struct.pack('<HHIIIII', 0x0100, 16, 24, 1, 0xFFFFFFFF, p_idx, u_idx)

    def end_ns(self, prefix, uri):
        p_idx = self.add_string(prefix)
        u_idx = self.add_string(uri)
        return struct.pack('<HHIIIII', 0x0101, 16, 24, 1, 0xFFFFFFFF, p_idx, u_idx)

    def start_element(self, tag, attrs=None, ns=None):
        tag_idx = self.add_string(tag)
        ns_idx = self.add_string(ns) if ns else 0xFFFFFFFF

        attrs_data = b''
        attr_count = len(attrs) if attrs else 0
        if attrs:
            for attr in attrs:
                ans, aname, raw_val, val_type, data_val = attr
                ans_idx = self.add_string(ans) if ans else 0xFFFFFFFF
                aname_idx = self.add_string(aname)
                raw_idx = self.add_string(raw_val) if raw_val is not None else 0xFFFFFFFF
                
                # Each attr is 20 bytes: ans_idx, aname_idx, raw_idx, size(2), res0(1), type(1), data(4)
                attrs_data += struct.pack('<IIIHBBI', ans_idx, aname_idx, raw_idx, 8, 0, val_type, data_val)

        chunk_size = 36 + 20 * attr_count
        header = struct.pack(
            '<HHIIIIIHHHHHH',
            0x0102,       # RES_XML_START_ELEMENT_TYPE
            16,           # header_size
            chunk_size,   # chunk_size
            1,            # line_number
            0xFFFFFFFF,   # comment
            ns_idx,       # ns_idx
            tag_idx,      # name_idx
            20,           # attr_start (offset relative to ResXMLTree_attrExt start)
            20,           # attr_size
            attr_count,   # attr_count
            0, 0, 0       # id_index, class_index, style_index
        )
        return header + attrs_data

    def end_element(self, tag, ns=None):
        tag_idx = self.add_string(tag)
        ns_idx = self.add_string(ns) if ns else 0xFFFFFFFF
        return struct.pack(
            '<HHIIIII',
            0x0103,       # RES_XML_END_ELEMENT_TYPE
            16,           # header_size
            24,           # chunk_size
            1,            # line_number
            0xFFFFFFFF,   # comment
            ns_idx,
            tag_idx
        )

def generate_binary_manifest():
    encoder = AxmlEncoder()
    NS_ANDROID = "http://schemas.android.com/apk/res/android"
    
    # Pre-register standard Android attribute resource IDs
    encoder.add_string("theme", 0x01010000)
    encoder.add_string("label", 0x01010001)
    encoder.add_string("icon", 0x01010002)
    encoder.add_string("name", 0x01010003)
    encoder.add_string("exported", 0x01010010)
    encoder.add_string("versionCode", 0x0101021b)
    encoder.add_string("versionName", 0x0101021c)
    encoder.add_string("minSdkVersion", 0x0101020c)
    encoder.add_string("targetSdkVersion", 0x01010270)
    encoder.add_string("allowBackup", 0x01010280)
    encoder.add_string("supportsRtl", 0x010103af)

    body_chunks = []
    body_chunks.append(encoder.start_ns("android", NS_ANDROID))

    pkg_name = "com.ritu.calendar"
    vcode = 1
    vname = "1.0.0"
    
    body_chunks.append(encoder.start_element(
        tag="manifest",
        attrs=[
            (None, "package", pkg_name, 0x03, encoder.add_string(pkg_name)),
            (NS_ANDROID, "versionCode", str(vcode), 0x10, vcode),
            (NS_ANDROID, "versionName", vname, 0x03, encoder.add_string(vname))
        ]
    ))

    body_chunks.append(encoder.start_element(
        tag="uses-sdk",
        attrs=[
            (NS_ANDROID, "minSdkVersion", "26", 0x10, 26),
            (NS_ANDROID, "targetSdkVersion", "34", 0x10, 34)
        ]
    ))
    body_chunks.append(encoder.end_element("uses-sdk"))

    perm_notif = "android.permission.POST_NOTIFICATIONS"
    body_chunks.append(encoder.start_element(
        tag="uses-permission",
        attrs=[(NS_ANDROID, "name", perm_notif, 0x03, encoder.add_string(perm_notif))]
    ))
    body_chunks.append(encoder.end_element("uses-permission"))

    app_class = "com.ritu.calendar.RituApplication"
    app_label = "Ritu"
    body_chunks.append(encoder.start_element(
        tag="application",
        attrs=[
            (NS_ANDROID, "label", app_label, 0x03, encoder.add_string(app_label)),
            (NS_ANDROID, "allowBackup", "true", 0x12, 0xFFFFFFFF),
            (NS_ANDROID, "supportsRtl", "true", 0x12, 0xFFFFFFFF),
            (NS_ANDROID, "name", app_class, 0x03, encoder.add_string(app_class))
        ]
    ))

    act_class = "com.ritu.calendar.MainActivity"
    body_chunks.append(encoder.start_element(
        tag="activity",
        attrs=[
            (NS_ANDROID, "name", act_class, 0x03, encoder.add_string(act_class)),
            (NS_ANDROID, "exported", "true", 0x12, 0xFFFFFFFF)
        ]
    ))

    body_chunks.append(encoder.start_element(tag="intent-filter"))

    act_main = "android.intent.action.MAIN"
    body_chunks.append(encoder.start_element(
        tag="action",
        attrs=[(NS_ANDROID, "name", act_main, 0x03, encoder.add_string(act_main))]
    ))
    body_chunks.append(encoder.end_element("action"))

    cat_launcher = "android.intent.category.LAUNCHER"
    body_chunks.append(encoder.start_element(
        tag="category",
        attrs=[(NS_ANDROID, "name", cat_launcher, 0x03, encoder.add_string(cat_launcher))]
    ))
    body_chunks.append(encoder.end_element("category"))

    body_chunks.append(encoder.end_element("intent-filter"))
    body_chunks.append(encoder.end_element("activity"))

    rec_class = "com.ritu.calendar.core.notifications.EventReminderReceiver"
    body_chunks.append(encoder.start_element(
        tag="receiver",
        attrs=[
            (NS_ANDROID, "name", rec_class, 0x03, encoder.add_string(rec_class)),
            (NS_ANDROID, "exported", "false", 0x12, 0x00000000)
        ]
    ))
    body_chunks.append(encoder.end_element("receiver"))

    body_chunks.append(encoder.end_element("application"))
    body_chunks.append(encoder.end_element("manifest"))
    body_chunks.append(encoder.end_ns("android", NS_ANDROID))

    string_pool = encoder.build_string_pool()
    res_map = encoder.build_res_map()
    body_data = b''.join(body_chunks)

    total_size = 8 + len(string_pool) + len(res_map) + len(body_data)
    main_header = struct.pack('<HHI', 0x0003, 8, total_size)

    return main_header + string_pool + res_map + body_data
