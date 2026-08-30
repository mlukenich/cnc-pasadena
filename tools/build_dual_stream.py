import os
import shutil
import struct
import io

def create_big_archive(entries_dict, output_big_path):
    entries = []
    for rel_path, data in entries_dict.items():
        norm_path = rel_path.replace('/', '\\')
        entries.append((norm_path, data))

    table_header_size = 16
    table_entries_size = sum(8 + len(name.encode('utf-8')) + 1 for name, _ in entries)
    table_total_size = table_header_size + table_entries_size

    current_offset = table_total_size
    file_table = []
    file_payloads = []

    for name, data in entries:
        size = len(data)
        file_table.append((current_offset, size, name))
        file_payloads.append(data)
        current_offset += size

    total_archive_size = current_offset

    with open(output_big_path, 'wb') as out:
        out.write(b'BIG4')
        out.write(struct.pack('<I', total_archive_size))
        out.write(struct.pack('>I', len(entries)))
        out.write(struct.pack('>I', table_total_size))

        for offset, size, name in file_table:
            out.write(struct.pack('>I', offset))
            out.write(struct.pack('>I', size))
            out.write(name.encode('utf-8') + b'\x00')

        for data in file_payloads:
            out.write(data)

    print(f"Created BIG archive '{output_big_path}' ({len(entries)} files, {total_archive_size} bytes)")

def build_universal_stream():
    print("=" * 60)
    print("Building Universal Stream Archive (Mod & Patch Stream Modes)...")
    print("=" * 60)

    sdk_big = 'ModSDK/BuiltMods/mods/MarylandShowdown.big'
    if not os.path.exists(sdk_big):
        print(f"Error: {sdk_big} not found!")
        return

    entries = {}
    with open(sdk_big, 'rb') as f:
        magic = f.read(4)
        total_size = struct.unpack('<I', f.read(4))[0]
        num_files = struct.unpack('>I', f.read(4))[0]
        table_size = struct.unpack('>I', f.read(4))[0]

        table_data = f.read(table_size - 16)
        tb = io.BytesIO(table_data)
        file_info = []
        for _ in range(num_files):
            offset = struct.unpack('>I', tb.read(4))[0]
            size = struct.unpack('>I', tb.read(4))[0]
            name = bytearray()
            while True:
                b = tb.read(1)
                if not b or b == b'\x00':
                    break
                name.extend(b)
            file_info.append((offset, size, name.decode('latin1')))

        for offset, size, name in file_info:
            f.seek(offset)
            data = f.read(size)
            entries[name] = data

    print(f"Read {len(entries)} original stream files from {sdk_big}")

    # Add static stream aliases so game loads stream in direct SkuDef mode
    aliases = {}
    for name, data in entries.items():
        if name.startswith('data\\mod'):
            ext = name[len('data\\mod'):]
            aliases[f"data\\static_common_9{ext}"] = data
            aliases[f"data\\static{ext}"] = data
            aliases[f"data\\static_l_common_9{ext}"] = data
            aliases[f"data\\static_l{ext}"] = data

    entries.update(aliases)
    print(f"Total stream files with patch aliases: {len(entries)}")

    out_path = 'build/MarylandShowdown_1.0_Streams.big'
    create_big_archive(entries, out_path)
    print(f"Universal stream built successfully -> {out_path}")

if __name__ == '__main__':
    build_universal_stream()
