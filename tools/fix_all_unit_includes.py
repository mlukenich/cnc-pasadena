import os
import re

def fix_includes():
    print("=" * 60)
    print("Fixing BaseObject Instance Includes for all 44 Assets...")
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

            # Determine base type
            base_type = None
            if 'inheritFrom="BaseStructure"' in content or 'Structures' in root:
                base_type = "BaseObjects/BaseStructure.xml"
            elif 'inheritFrom="BaseVehicle"' in content or any(v in f for v in ['Vehicle', 'Harvester', 'MCV', 'Buggy', 'Dually', 'Pontoon', 'Monster', 'Prius', 'Roundabout', 'StreetSweeper', 'DroneCarrier']):
                base_type = "BaseObjects/BaseVehicle.xml"
            elif 'inheritFrom="BaseInfantry"' in content or any(v in f for v in ['Infantry', 'Militia', 'Sniper', 'Lawncare', 'Commando', 'Cyclist', 'Officer', 'Pilates']):
                base_type = "BaseObjects/BaseInfantry.xml"
            elif 'inheritFrom="BaseSquad"' in content or 'Squad' in f:
                base_type = "BaseObjects/BaseSquad.xml"
            elif any(v in f for v in ['Aircraft', 'Drone', 'Seaplane', 'Cropduster']):
                base_type = "BaseObjects/BaseVehicle.xml"

            if base_type:
                inc_tag = f'\t<Includes>\n\t\t<Include type="instance" source="DATA:{base_type}" />\n\t</Includes>'
                content = re.sub(r'<Includes\s*/>|<Includes>.*?</Includes>', inc_tag, content, flags=re.DOTALL)

                with open(p, 'w', encoding='utf-8') as fp:
                    fp.write(content)

    print("All asset files updated with correct BaseObject instance includes!")

if __name__ == '__main__':
    fix_includes()
