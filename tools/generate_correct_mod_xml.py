import os

def generate_mod_xml():
    src_data = os.path.abspath('src/Data')
    includes = []

    # 1. BaseObjects includes from CnC3Xml
    base_objects = [
        "BaseObjects/BaseStructure.xml",
        "BaseObjects/BaseVehicle.xml",
        "BaseObjects/BaseInfantry.xml",
        "BaseObjects/BaseSquad.xml"
    ]
    for bo in base_objects:
        includes.append(f'\t\t<Include type="all" source="DATA:{bo}" />')

    # 2. Global Game Data
    order = [
        'GlobalData/Armor.xml',
        'GlobalData/Weapon.xml',
        'GlobalData/Upgrade.xml',
        'GlobalData/Locomotor.xml',
        'GlobalData/LogicCommand.xml',
        'GlobalData/LogicCommandSet.xml',
        'GlobalData/SoundEvents.xml',
        'GlobalData/FXParticleSystem.xml'
    ]
    for o in order:
        p = os.path.join(src_data, o.replace('/', '\\'))
        if os.path.exists(p):
            includes.append(f'\t\t<Include type="all" source="DATA:MarylandShowdown/data/Data/{o}" />')

    # 3. Add all Pasadena structures and units
    for root, _, files in os.walk(src_data):
        for f in files:
            if f.endswith('.xml') and not any(o in f for o in ['Armor', 'Weapon', 'Upgrade', 'Locomotor', 'LogicCommand', 'SoundEvents', 'FXParticleSystem', 'AIPersonality', 'AIStrategic']):
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, src_data).replace('\\', '/')
                includes.append(f'\t\t<Include type="all" source="DATA:MarylandShowdown/data/Data/{rel_p}" />')

    inc_block = '\n'.join(includes)

    mod_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags></Tags>
	<Includes>
		<Include type="reference" source="DATA:static.xml" />
		<Include type="reference" source="DATA:global.xml" />

{inc_block}
	</Includes>
</AssetDeclaration>
"""
    dest = os.path.abspath('ModSDK/Mods/MarylandShowdown/data/mod.xml')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'w', encoding='utf-8') as fp:
        fp.write(mod_xml)

    print(f"Generated mod.xml with {len(includes)} included asset files!")

if __name__ == '__main__':
    generate_mod_xml()
