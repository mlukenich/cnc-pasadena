import re

with open('src/Data/GlobalData/Locomotor.xml', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\s*MaxSpeed="[^"]+"', '', content)

with open('src/Data/GlobalData/Locomotor.xml', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned Locomotor.xml!")
