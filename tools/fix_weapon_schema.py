import re

with open('src/Data/GlobalData/Weapon.xml', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove undeclared attributes: ReAcquireDetailFrequency, etc.
content = re.sub(r'\s*ReAcquireDetailFrequency="[^"]+"', '', content)
content = re.sub(r'\s*ClipReloadTime="([^"]+)"', '', content)

with open('src/Data/GlobalData/Weapon.xml', 'w', encoding='utf-8') as f:
    f.write(content)

print('Cleaned attributes in src/Data/GlobalData/Weapon.xml!')
