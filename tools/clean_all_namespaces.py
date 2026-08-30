import os
import re

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.xml'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fp:
                content = fp.read()

            # Clean ns0: prefixes
            content = re.sub(r'</?ns0:', lambda m: m.group(0).replace('ns0:', ''), content)
            content = re.sub(r'xmlns:ns0="[^"]+"', '', content)
            content = re.sub(r'<Tags\s*/>', '<Tags/>', content)

            with open(p, 'w', encoding='utf-8') as fp:
                fp.write(content)

print("Cleaned XML namespaces across all src files!")
