import struct

def encode_csf(strings_dict):
    """
    Encodes a Python dictionary of {label: text} into binary EA CSF (Compiled String File) format.
    """
    header = b' FSC'
    version = 3
    num_labels = len(strings_dict)
    num_strings = len(strings_dict)
    unused = 0
    language = 0

    out = bytearray()
    out.extend(header)
    out.extend(struct.pack('<IIIII', version, num_labels, num_strings, unused, language))

    for label, val in strings_dict.items():
        # Label block
        out.extend(b' LBL')
        out.extend(struct.pack('<II', 1, len(label)))
        out.extend(label.encode('ascii'))

        # String block
        out.extend(b' RTS')
        val_utf16 = val.encode('utf-16le')
        char_len = len(val)
        out.extend(struct.pack('<I', char_len))

        # Invert bytes (CSF XOR encryption: byte ^ 0xFF)
        encoded_bytes = bytes([b ^ 0xFF for b in val_utf16])
        out.extend(encoded_bytes)

    return bytes(out)

def decode_csf(data):
    """
    Decodes an uncompressed binary CSF file into a dictionary of {label: text}.
    """
    magic = data[:4]
    if magic != b' FSC':
        raise ValueError(f"Invalid CSF magic: {magic}")
    version, num_labels, num_strings, unused, language = struct.unpack('<IIIII', data[4:24])

    pos = 24
    result = {}
    for _ in range(num_labels):
        lbl_magic = data[pos:pos+4]
        if lbl_magic != b' LBL':
            raise ValueError(f"Expected ' LBL' at pos {pos}, got {lbl_magic}")
        pos += 4
        num_vals, lbl_len = struct.unpack('<II', data[pos:pos+8])
        pos += 8
        label_name = data[pos:pos+lbl_len].decode('ascii')
        pos += lbl_len

        str_magic = data[pos:pos+4]
        if str_magic != b' RTS' and str_magic != b'WRTS':
            raise ValueError(f"Expected ' RTS' at pos {pos}, got {str_magic}")
        pos += 4
        char_len = struct.unpack('<I', data[pos:pos+4])[0]
        pos += 4
        raw_bytes = data[pos:pos + char_len * 2]
        pos += char_len * 2
        decoded_bytes = bytes([b ^ 0xFF for b in raw_bytes])
        val_str = decoded_bytes.decode('utf-16le')
        result[label_name] = val_str

    return result

if __name__ == '__main__':
    sample = {
        'GUI:FactionGDI': "The 'Dena Dominion (Pasadena, MD)",
        'GUI:FactionNOD': "The Columbia Planned Collective (Columbia, MD)",
        'GUI:FactionAlien': "MoCo Commuters (Montgomery County)",
        'GUI:GDI_Desc': "Pasadena, MD - Waterman grit, straight-pipe diesel horsepower, crab shacks, lifted trucks, and Old Bay artillery.",
        'GUI:NOD_Desc': "Columbia, MD - Master-planned HOA paradise, silent EV swarms, citation stun beams, organic co-ops, and strict zoning laws.",
        'GUI:Alien_Desc': "Montgomery County - Beltway gridlock, speed camera laser batteries, metro delays, and property tax orbital superweapons."
    }

    csf_bytes = encode_csf(sample)
    print(f"Encoded {len(sample)} strings into {len(csf_bytes)} bytes CSF.")
    decoded = decode_csf(csf_bytes)
    print("Decoded verification:")
    for k, v in decoded.items():
        print(f"  {k} -> {v}")
