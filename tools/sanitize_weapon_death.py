import re

valid_death_types = {
    "NONE", "NORMAL", "CRUSHED", "BURNED", "EXPLODED", "POISONED",
    "TOPPLED", "FLOODED", "SUICIDED", "LASERED", "DETONATED",
    "SPLATTED", "POISONED_BETA", "KNOCKBACK", "SUPERNATURAL", "FADED",
    "SLAUGHTERED", "CATALYST", "ALL"
}

with open('src/Data/GlobalData/Weapon.xml', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace KNOCKED_BACK -> KNOCKBACK, STUNNED -> DETONATED
content = content.replace('DeathType="KNOCKED_BACK"', 'DeathType="KNOCKBACK"')
content = content.replace('DeathType="STUNNED"', 'DeathType="DETONATED"')

def sanitize_death(match):
    val = match.group(1)
    if val in valid_death_types:
        return match.group(0)
    return 'DeathType="NORMAL"'

content = re.sub(r'DeathType="([^"]+)"', sanitize_death, content)

with open('src/Data/GlobalData/Weapon.xml', 'w', encoding='utf-8') as f:
    f.write(content)

print("Sanitized all DeathType enums!")
