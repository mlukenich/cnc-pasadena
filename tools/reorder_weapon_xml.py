import xml.etree.ElementTree as ET

ET.register_namespace('', "uri:ea.com:eala:asset")

with open('src/Data/GlobalData/Weapon.xml', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace MinDuration -> MinSeconds, MaxDuration -> MaxSeconds
content = content.replace('MinDuration=', 'MinSeconds=').replace('MaxDuration=', 'MaxSeconds=')

with open('src/Data/GlobalData/Weapon.xml', 'w', encoding='utf-8') as f:
    f.write(content)

# Now reorder
tree = ET.parse('src/Data/GlobalData/Weapon.xml')
root = tree.getroot()

for wt in root.findall('.//{uri:ea.com:eala:asset}WeaponTemplate'):
    firing = wt.find('{uri:ea.com:eala:asset}FiringDuration')
    clip = wt.find('{uri:ea.com:eala:asset}ClipReloadTime')
    preattack = wt.find('{uri:ea.com:eala:asset}PreAttackDelay')
    nuggets = wt.find('{uri:ea.com:eala:asset}Nuggets')

    for elem in list(wt):
        wt.remove(elem)

    if firing is not None:
        wt.append(firing)
    if clip is not None:
        wt.append(clip)
    if preattack is not None:
        wt.append(preattack)
    if nuggets is not None:
        wt.append(nuggets)

tree.write('src/Data/GlobalData/Weapon.xml', encoding='utf-8', xml_declaration=True)
print("Updated MinSeconds and reordered Weapon.xml!")
