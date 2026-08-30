import xml.etree.ElementTree as ET
import re

fx_map = {
    'Pasadena_Buckshot_Hit': 'GDI_MACHINEGUN',
    'Pasadena_Harpoon_Impact': 'GDI_MISSILE',
    'Pasadena_Leafblower_Blast': 'GDI_SONIC',
    'Pasadena_SaltyBob_Explosion': 'GDI_GRENADE',
    'Pasadena_MudBuggy_Mortar': 'GDI_CANNON',
    'Pasadena_F250_Cannon': 'GDI_CANNON',
    'Pasadena_Barge_MG': 'GDI_MACHINEGUN',
    'Pasadena_Juggernaut_Blast': 'GDI_CANNON',
    'Pasadena_Cropduster_Bomb': 'GDI_BOMB',
    'Pasadena_Turret_MG': 'GDI_MACHINEGUN',
    'Pasadena_Flak_Burst': 'GDI_MISSILE',
    'Pasadena_OldBay_Explosion': 'GDI_ION',
    'Columbia_Pulse_Hit': 'NOD_LASER',
    'Columbia_Pilates_Impact': 'NOD_MISSILE',
    'Columbia_Sanitizer_Flame': 'NOD_FLAMETHROWER',
    'Columbia_Karen_Stun': 'NOD_HALLUCINE',
    'Columbia_Scooter_Rocket': 'NOD_MISSILE',
    'Columbia_Prius_Disabler': 'NOD_LASER',
    'Columbia_Roundabout_Laser': 'NOD_LASER',
    'Columbia_Sweeper_Burn': 'NOD_FLAMETHROWER',
    'Columbia_Stealth_Missile': 'NOD_MISSILE',
    'Columbia_Laser_Beam': 'NOD_LASER',
    'Columbia_Drone_Laser': 'NOD_LASER',
    'Columbia_Foreclosure_Beam': 'NOD_LASER',
    'Columbia_Acoustic_Blast': 'NOD_SONIC'
}

with open('src/Data/GlobalData/Weapon.xml', 'r', encoding='utf-8') as f:
    content = f.read()

for k, v in fx_map.items():
    content = content.replace(f'DamageFXType="{k}"', f'DamageFXType="{v}"')

with open('src/Data/GlobalData/Weapon.xml', 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped all DamageFXType enums successfully!")
