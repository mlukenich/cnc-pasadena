import os

def write_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Wrote: {filepath}')

def run():
    # 1. PasadenaConYard
    write_file('src/Data/Pasadena/Structures/PasadenaConYard.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaConYard"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaConYard"
		ButtonImage="Button_PasadenaConYard"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="3000"
		BuildTime="30"
		EnergyProduction="10"
		CommandSet="PasadenaConYardCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS CONSTRUCTION_YARD MP_COUNT_FOR_VICTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE"
		PlacementViewAngle="315d">
		<DisplayName>Name:PasadenaConYard</DisplayName>
		<Description>Desc:PasadenaConYard</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="5000.0" />
		</Body>
		<Behaviors>
			<ProductionUpdate id="ModuleTag_ProductionUpdate" GiveNoXP="true" />
			<ConstructionYardUpdate id="ModuleTag_ConstructionYardUpdate" />
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="40.0" MinorRadius="40.0" Height="35.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 2. PasadenaPowerPlant
    write_file('src/Data/Pasadena/Structures/PasadenaPowerPlant.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaPowerPlant"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaPowerPlant"
		ButtonImage="Button_PasadenaPowerPlant"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="600"
		BuildTime="6"
		EnergyProduction="22"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_POWER MP_COUNT_FOR_VICTORY"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaPowerPlant</DisplayName>
		<Description>Desc:PasadenaPowerPlant</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1500.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="25.0" MinorRadius="25.0" Height="25.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 3. PasadenaRefinery
    write_file('src/Data/Pasadena/Structures/PasadenaRefinery.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaRefinery"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaRefinery"
		ButtonImage="Button_PasadenaRefinery"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="2000"
		BuildTime="20"
		EnergyProduction="-6"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS SUPPLY_GATHERING_CENTER MP_COUNT_FOR_VICTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaRefinery</DisplayName>
		<Description>Desc:PasadenaRefinery</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3000.0" />
		</Body>
		<Behaviors>
			<SupplyWarehouseCripplingBehavior id="ModuleTag_SupplyWarehouseUpdate" />
			<FreeiesBehavior id="ModuleTag_FreeHarvester">
				<FreeObject>PasadenaHarvester</FreeObject>
			</FreeiesBehavior>
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="45.0" MinorRadius="35.0" Height="30.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 4. PasadenaBarracks
    write_file('src/Data/Pasadena/Structures/PasadenaBarracks.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaBarracks"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaBarracks"
		ButtonImage="Button_PasadenaBarracks"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="500"
		BuildTime="5"
		EnergyProduction="-5"
		CommandSet="PasadenaBarracksCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_FACTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaBarracks</DisplayName>
		<Description>Desc:PasadenaBarracks</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="2000.0" />
		</Body>
		<Behaviors>
			<ProductionUpdate id="ModuleTag_ProductionUpdate" GiveNoXP="true" />
			<QueueProductionExitUpdate id="ModuleTag_Exit">
				<UnitCreatePoint X="0.0" Y="0.0" Z="0.0" />
				<NaturalRallyPoint X="40.0" Y="0.0" Z="0.0" />
			</QueueProductionExitUpdate>
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="30.0" MinorRadius="30.0" Height="25.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 5. PasadenaWarFactory
    write_file('src/Data/Pasadena/Structures/PasadenaWarFactory.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaWarFactory"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaWarFactory"
		ButtonImage="Button_PasadenaWarFactory"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="2000"
		BuildTime="20"
		EnergyProduction="-7"
		CommandSet="PasadenaWarFactoryCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_FACTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaWarFactory</DisplayName>
		<Description>Desc:PasadenaWarFactory</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="4000.0" />
		</Body>
		<Behaviors>
			<ProductionUpdate id="ModuleTag_ProductionUpdate" GiveNoXP="true" />
			<QueueProductionExitUpdate id="ModuleTag_Exit">
				<UnitCreatePoint X="0.0" Y="0.0" Z="0.0" />
				<NaturalRallyPoint X="60.0" Y="0.0" Z="0.0" />
			</QueueProductionExitUpdate>
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="50.0" MinorRadius="45.0" Height="30.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 6. PasadenaAirfield
    write_file('src/Data/Pasadena/Structures/PasadenaAirfield.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaAirfield"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaAirfield"
		ButtonImage="Button_PasadenaAirfield"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="1000"
		BuildTime="10"
		EnergyProduction="-5"
		CommandSet="PasadenaAirfieldCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_FACTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaAirfield</DisplayName>
		<Description>Desc:PasadenaAirfield</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="2500.0" />
		</Body>
		<Behaviors>
			<ProductionUpdate id="ModuleTag_ProductionUpdate" GiveNoXP="true" />
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="40.0" MinorRadius="40.0" Height="20.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 7. PasadenaTechCenter
    write_file('src/Data/Pasadena/Structures/PasadenaTechCenter.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaTechCenter"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaTechCenter"
		ButtonImage="Button_PasadenaTechCenter"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="3000"
		BuildTime="30"
		EnergyProduction="-10"
		CommandSet="PasadenaTechCenterCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_TECH_CENTER"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaTechCenter</DisplayName>
		<Description>Desc:PasadenaTechCenter</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3500.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="35.0" MinorRadius="35.0" Height="35.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 8. PasadenaDefenseTurret
    write_file('src/Data/Pasadena/Structures/PasadenaDefenseTurret.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaDefenseTurret"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaDefenseTurret"
		ButtonImage="Button_PasadenaDefenseTurret"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="800"
		BuildTime="8"
		EnergyProduction="-3"
		WeaponCategory="CANNON"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_BASE_DEFENSE ATTACK_NEEDS_LINE_OF_SIGHT CAN_ATTACK"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaDefenseTurret</DisplayName>
		<Description>Desc:PasadenaDefenseTurret</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="2200.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaTurretPotCannon" />
				<TurretSettings TurnRate="180" MinPhysicalPitch="-20d" MaxPhysicalPitch="45d">
					<TurretPose X="0.0" Y="0.0" Z="15.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="CYLINDER" MajorRadius="18.0" Height="30.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 9. PasadenaAA
    write_file('src/Data/Pasadena/Structures/PasadenaAA.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaAA"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaAA"
		ButtonImage="Button_PasadenaAA"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="700"
		BuildTime="7"
		EnergyProduction="-3"
		WeaponCategory="GUN"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_BASE_DEFENSE CAN_ATTACK"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaAA</DisplayName>
		<Description>Desc:PasadenaAA</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1800.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaFlakCannon" />
				<TurretSettings TurnRate="250" MinPhysicalPitch="10d" MaxPhysicalPitch="85d">
					<TurretPose X="0.0" Y="0.0" Z="20.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="CYLINDER" MajorRadius="16.0" Height="25.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 10. PasadenaSuperweapon
    write_file('src/Data/Pasadena/Structures/PasadenaSuperweapon.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaSuperweapon"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_PasadenaSuperweapon"
		ButtonImage="Button_PasadenaSuperweapon"
		Side="Pasadena"
		EditorSorting="STRUCTURE"
		BuildCost="5000"
		BuildTime="50"
		EnergyProduction="-15"
		CommandSet="PasadenaSuperweaponCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS SUPERWEAPON"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:PasadenaSuperweapon</DisplayName>
		<Description>Desc:PasadenaSuperweapon</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="6000.0" />
		</Body>
		<Behaviors>
			<SpecialPower id="ModuleTag_OldBayCataclysmSP" SpecialPowerTemplate="SpecialPower_PasadenaOldBayCataclysm" Update="SpecialPowerUpdate_OldBay" />
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="CYLINDER" MajorRadius="30.0" Height="60.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # ==================== PASADENA UNITS ====================

    # 1. PasadenaMCV
    write_file('src/Data/Pasadena/Units/PasadenaMCV.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaMCV"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_PasadenaMCV"
		ButtonImage="Button_PasadenaMCV"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="3500"
		BuildTime="35"
		KindOf="SELECTABLE CAN_ATTACK CAN_CAST_REFLECTIONS VEHICLE HUGE_VEHICLE MCV EXPANSION_UNIT"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaLiftedTruckLocomotor">
		<DisplayName>Name:PasadenaMCV</DisplayName>
		<Description>Desc:PasadenaMCV</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="5000.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="28.0" MinorRadius="18.0" Height="22.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 2. PasadenaHarvester
    write_file('src/Data/Pasadena/Units/PasadenaHarvester.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaHarvester"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_PasadenaHarvester"
		ButtonImage="Button_PasadenaHarvester"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="1400"
		BuildTime="14"
		KindOf="SELECTABLE CAN_CAST_REFLECTIONS VEHICLE HARVESTER"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaLiftedTruckLocomotor">
		<DisplayName>Name:PasadenaHarvester</DisplayName>
		<Description>Desc:PasadenaHarvester</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3200.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="24.0" MinorRadius="14.0" Height="18.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 3. PasadenaInfantryMilitia
    write_file('src/Data/Pasadena/Units/PasadenaInfantryMilitia.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaInfantryMilitia"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_PasadenaMilitia"
		ButtonImage="Button_PasadenaMilitia"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="150"
		BuildTime="2"
		WeaponCategory="GUN"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaInfantryFootLocomotor">
		<DisplayName>Name:PasadenaInfantryMilitia</DisplayName>
		<Description>Desc:PasadenaInfantryMilitia</Description>
		<ArmorSet Armor="PasadenaInfantryDenimArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="160.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaMilitiaShotgun" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="6.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 4. PasadenaInfantryLeafblower
    write_file('src/Data/Pasadena/Units/PasadenaInfantryLeafblower.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaInfantryLeafblower"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_PasadenaLeafblower"
		ButtonImage="Button_PasadenaLeafblower"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="250"
		BuildTime="3"
		WeaponCategory="GRENADE"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaInfantryFootLocomotor">
		<DisplayName>Name:PasadenaInfantryLeafblower</DisplayName>
		<Description>Desc:PasadenaInfantryLeafblower</Description>
		<ArmorSet Armor="PasadenaInfantryDenimArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="220.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaLeafblowerStream" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="6.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 5. PasadenaInfantryWaterman
    write_file('src/Data/Pasadena/Units/PasadenaInfantryWaterman.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaInfantryWaterman"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_PasadenaWaterman"
		ButtonImage="Button_PasadenaWaterman"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="600"
		BuildTime="6"
		WeaponCategory="SNIPER"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY SNIPER"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaInfantryFootLocomotor">
		<DisplayName>Name:PasadenaInfantryWaterman</DisplayName>
		<Description>Desc:PasadenaInfantryWaterman</Description>
		<ArmorSet Armor="PasadenaInfantryDenimArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="180.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaWatermanHarpoon" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="6.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 6. PasadenaInfantryCommando
    write_file('src/Data/Pasadena/Units/PasadenaInfantryCommando.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaInfantryCommando"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_PasadenaCommando"
		ButtonImage="Button_PasadenaCommando"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="1500"
		BuildTime="15"
		WeaponCategory="GRENADE"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY UNIQUE_UNIT COMMANDO"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaInfantryFootLocomotor">
		<DisplayName>Name:PasadenaInfantryCommando</DisplayName>
		<Description>Desc:PasadenaInfantryCommando</Description>
		<ArmorSet Armor="PasadenaInfantryDenimArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="600.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaCommandoMolotov" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="7.0" Height="15.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 7. PasadenaVehicleDually
    write_file('src/Data/Pasadena/Units/PasadenaVehicleDually.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaVehicleDually"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_PasadenaDually"
		ButtonImage="Button_PasadenaDually"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="700"
		BuildTime="7"
		CommandSet="PasadenaDuallyCommandSet"
		WeaponCategory="GUN"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaLiftedTruckLocomotor">
		<DisplayName>Name:PasadenaVehicleDually</DisplayName>
		<Description>Desc:PasadenaVehicleDually</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1100.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaDuallyFiftyCal" />
				<TurretSettings TurnRate="240" MinPhysicalPitch="-10d" MaxPhysicalPitch="30d">
					<TurretPose X="0.0" Y="0.0" Z="8.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Behaviors>
			<SpecialPower id="ModuleTag_RollingCoalSP" SpecialPowerTemplate="SpecialPower_PasadenaRollingCoal" Update="SpecialPowerUpdate_RollingCoal" />
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="16.0" MinorRadius="10.0" Height="12.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 8. PasadenaVehicleBuggy
    write_file('src/Data/Pasadena/Units/PasadenaVehicleBuggy.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaVehicleBuggy"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_PasadenaBuggy"
		ButtonImage="Button_PasadenaBuggy"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="500"
		BuildTime="5"
		WeaponCategory="ROCKET"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaLiftedTruckLocomotor">
		<DisplayName>Name:PasadenaVehicleBuggy</DisplayName>
		<Description>Desc:PasadenaVehicleBuggy</Description>
		<ArmorSet Armor="PasadenaFiberglassHullArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="650.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaBuggyRockets" />
				<TurretSettings TurnRate="300" MinPhysicalPitch="0d" MaxPhysicalPitch="40d">
					<TurretPose X="0.0" Y="0.0" Z="6.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="BOX" MajorRadius="12.0" MinorRadius="8.0" Height="8.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 9. PasadenaVehiclePontoon
    write_file('src/Data/Pasadena/Units/PasadenaVehiclePontoon.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaVehiclePontoon"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_PasadenaPontoon"
		ButtonImage="Button_PasadenaPontoon"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="1600"
		BuildTime="16"
		WeaponCategory="CANNON"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE AMPHIBIOUS"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaPontoonAmphibiousLocomotor">
		<DisplayName>Name:PasadenaVehiclePontoon</DisplayName>
		<Description>Desc:PasadenaVehiclePontoon</Description>
		<ArmorSet Armor="PasadenaFiberglassHullArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1800.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaPontoonMortar" />
				<TurretSettings TurnRate="120" MinPhysicalPitch="10d" MaxPhysicalPitch="60d">
					<TurretPose X="0.0" Y="0.0" Z="10.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="22.0" MinorRadius="14.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 10. PasadenaVehicleMonster
    write_file('src/Data/Pasadena/Units/PasadenaVehicleMonster.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaVehicleMonster"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_PasadenaMonster"
		ButtonImage="Button_PasadenaMonster"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="2200"
		BuildTime="22"
		WeaponCategory="FORCE"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE HUGE_VEHICLE CRUSH_VEHICLES"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaLiftedTruckLocomotor">
		<DisplayName>Name:PasadenaVehicleMonster</DisplayName>
		<Description>Desc:PasadenaVehicleMonster</Description>
		<ArmorSet Armor="PasadenaRustedSteelArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3800.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaMudderSubwoofer" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="26.0" MinorRadius="18.0" Height="22.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 11. PasadenaAircraftSeaplane
    write_file('src/Data/Pasadena/Units/PasadenaAircraftSeaplane.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="PasadenaAircraftSeaplane"
		inheritFrom="BaseAircraft"
		SelectPortrait="Portrait_PasadenaSeaplane"
		ButtonImage="Button_PasadenaSeaplane"
		Side="Pasadena"
		EditorSorting="UNIT"
		BuildCost="1100"
		BuildTime="11"
		WeaponCategory="GRENADE"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS AIRCRAFT BOMBER"
		RadarPriority="UNIT"
		LocomotorSet="PasadenaAircraftFlyLocomotor">
		<DisplayName>Name:PasadenaAircraftSeaplane</DisplayName>
		<Description>Desc:PasadenaAircraftSeaplane</Description>
		<ArmorSet Armor="PasadenaFiberglassHullArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="800.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaSeaplaneBomb" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="20.0" MinorRadius="22.0" Height="8.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    print('Pasadena assets generated successfully.')

if __name__ == '__main__':
    run()
