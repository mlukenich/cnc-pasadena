import re

valid_damage_fx = {
    "DEFAULT", "GDI_CANNON", "GDI_MISSILE", "GDI_MINE", "GDI_LASER", "GDI_MACHINEGUN",
    "GDI_RIFLE", "GDI_GRENADE", "GDI_FLAMETHROWER", "GDI_BOMB", "GDI_SONIC", "GDI_RAILGUN",
    "GDI_ION", "GDI_SHOCKWAVE", "NOD_CANNON", "NOD_MISSILE", "NOD_MINE", "NOD_LASER",
    "NOD_MACHINEGUN", "NOD_RIFLE", "NOD_GRENADE", "NOD_FLAMETHROWER", "NOD_BOMB", "NOD_SONIC",
    "NOD_RAILGUN", "NOD_ION", "NOD_SEED", "NOD_HALLUCINE", "ALIEN_CANNON", "ALIEN_PLASMADISK",
    "ALIEN_MINE", "ALIEN_LASER", "ALIEN_MACHINEGUN", "ALIEN_BUZZER", "ALIEN_GRENADE",
    "ALIEN_TIOXIN", "ALIEN_BOMB", "ALIEN_ION", "ALIEN_SONIC", "ALIEN_RAILGUN",
    "ALIEN_DISINTEGRATOR", "REFLECTED", "GENERIC_FIRE", "POISON", "CLUBBING", "UNDEFINED"
}

with open('src/Data/GlobalData/Weapon.xml', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_fx(match):
    val = match.group(1)
    if val in valid_damage_fx:
        return match.group(0)
    return 'DamageFXType="GDI_MACHINEGUN"'

content = re.sub(r'DamageFXType="([^"]+)"', replace_fx, content)

with open('src/Data/GlobalData/Weapon.xml', 'w', encoding='utf-8') as f:
    f.write(content)

print("Sanitized all DamageFXType attributes to valid enums!")
