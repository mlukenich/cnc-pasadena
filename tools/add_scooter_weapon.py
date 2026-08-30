import re

with open('src/Data/GlobalData/Weapon.xml', 'r', encoding='utf-8') as f:
    content = f.read()

if 'ColumbiaScooterRocket' not in content:
    scooter_weapon = """
	<WeaponTemplate
		id="ColumbiaScooterRocket"
		Name="ColumbiaScooterRocket"
		AttackRange="300.0"
		WeaponSpeed="1200.0"
		FireFX="FX_RocketFire"
		FireSound="Columbia_Taser_Zap"
		AcceptableAimDelta="30d"
		ClipSize="2"
		AutoReloadsClip="AUTO">
		<FiringDuration MinSeconds="0.2s" MaxSeconds="0.2s" />
		<ClipReloadTime MinSeconds="2.0s" MaxSeconds="2.0s" />
		<Nuggets>
			<DamageNugget
				Damage="150.0"
				Radius="15.0"
				DamageType="ROCKET"
				DamageFXType="NOD_MISSILE"
				DeathType="EXPLODED" />
		</Nuggets>
	</WeaponTemplate>
"""
    content = content.replace('</AssetDeclaration>', scooter_weapon + '\n</AssetDeclaration>')

    with open('src/Data/GlobalData/Weapon.xml', 'w', encoding='utf-8') as f:
        f.write(content)

print("Added ColumbiaScooterRocket to Weapon.xml!")
