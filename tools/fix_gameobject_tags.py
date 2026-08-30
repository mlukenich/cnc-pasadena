import os
import re
import xml.etree.ElementTree as ET

def fix_gameobjects():
    print("=" * 60)
    print("Converting <DisplayName>/<Description> tags to attributes...")
    print("=" * 60)

    for root, _, files in os.walk('src/Data'):
        for f in files:
            if not f.endswith('.xml'):
                continue
            if 'GlobalData' in root or 'AI' in root:
                continue

            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fp:
                content = fp.read()

            # Find DisplayName and Description
            dn_match = re.search(r'<DisplayName>(.*?)</DisplayName>', content)
            desc_match = re.search(r'<Description>(.*?)</Description>', content)

            dn_val = dn_match.group(1).strip() if dn_match else None
            desc_val = desc_match.group(1).strip() if desc_match else None

            # Remove child tags
            content = re.sub(r'\s*<DisplayName>.*?</DisplayName>', '', content)
            content = re.sub(r'\s*<Description>.*?</Description>', '', content)

            # Insert into GameObject tag
            def add_attrs(match):
                tag_head = match.group(1)
                extra = ""
                if dn_val and 'DisplayName=' not in tag_head:
                    extra += f' DisplayName="{dn_val}"'
                if desc_val and 'Description=' not in tag_head:
                    extra += f' Description="{desc_val}"'
                return f'<GameObject{tag_head}{extra}>'

            content = re.sub(r'<GameObject([^>]+)>', add_attrs, content, count=1)

            with open(p, 'w', encoding='utf-8') as fp:
                fp.write(content)

    print("Successfully converted all GameObject tags to schema-compliant attributes!")

if __name__ == '__main__':
    fix_gameobjects()
