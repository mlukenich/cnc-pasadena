import xml.etree.ElementTree as ET

tree = ET.parse('src/Data/GlobalData/LogicCommand.xml')
root = tree.getroot()

for lc in root.findall('{uri:ea.com:eala:asset}LogicCommand'):
    cmd_type = lc.attrib.get('Type', '')
    cmd_id = lc.attrib.get('id', '')

    if cmd_type == 'CONSTRUCT':
        # Check if building a structure or training a unit
        if any(w in cmd_id for w in ['ConYard', 'PowerPlant', 'Refinery', 'Barracks', 'WarFactory', 'AirTower', 'TechCenter', 'WatchTower', 'LaserTurret', 'AntiAir', 'Superweapon']):
            lc.attrib['Type'] = 'CONSTRUCTION_YARD_CONSTRUCT'
        elif any(w in cmd_id for w in ['Upgrade']):
            lc.attrib['Type'] = 'PLAYER_UPGRADE'
        elif any(w in cmd_id for w in ['SpecialPower', 'RollingCoal', 'CrabFeast', 'Citation', 'Roundabout', 'Foreclosure']):
            lc.attrib['Type'] = 'SPECIAL_POWER'
        else:
            lc.attrib['Type'] = 'UNIT_BUILD'

tree.write('src/Data/GlobalData/LogicCommand.xml', encoding='utf-8', xml_declaration=True)
print("Updated all LogicCommand types to valid SAGE enums!")
