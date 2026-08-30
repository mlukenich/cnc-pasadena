import os
import struct
import shutil

def create_big_archive(source_dir, output_big_path):
    entries = []
    for root, _, files in os.walk(source_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, source_dir).replace('/', '\\')
            with open(full_path, 'rb') as fp:
                data = fp.read()
            entries.append((rel_path, data))

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

def deploy_mod():
    print("Packing and deploying mod...")
    os.makedirs('build', exist_ok=True)
    big_output = os.path.join('build', 'MarylandShowdown_1.0.big')
    create_big_archive('src', big_output)

    skudef_content = """mod-game 1.9
add-big MarylandShowdown_1.0.big
"""

    target_base_dirs = [
        r"C:\Users\mluke\OneDrive\Documents\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\OneDrive\Documents\Command and Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Documents\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Documents\Command and Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Saved Games\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\AppData\Roaming\Command & Conquer 3 Tiberium Wars\Mods"
    ]

    for base in target_base_dirs:
        try:
            dest = os.path.join(base, "MarylandShowdown")
            os.makedirs(dest, exist_ok=True)

            shutil.copy2(big_output, os.path.join(dest, "MarylandShowdown_1.0.big"))
            with open(os.path.join(dest, "MarylandShowdown_1.0.skudef"), 'w', encoding='utf-8') as f:
                f.write(skudef_content)
            print(f"Deployed clean mod to: {dest}")
        except Exception as e:
            print(f"Skipping {base}: {e}")

    print("\nMod deployment complete!")

if __name__ == '__main__':
    deploy_mod()
