import os

def write_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Wrote: {filepath}')

def run():
    # ==================== COLUMBIA STRUCTURES ====================

    # 1. ColumbiaConYard
    write_file('src/Data/Columbia/Structures/ColumbiaConYard.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaConYard"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaConYard"
		ButtonImage="Button_ColumbiaConYard"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="3000"
		BuildTime="30"
		EnergyProduction="10"
		CommandSet="ColumbiaConYardCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS CONSTRUCTION_YARD MP_COUNT_FOR_VICTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE"
		PlacementViewAngle="315d">
		<DisplayName>Name:ColumbiaConYard</DisplayName>
		<Description>Desc:ColumbiaConYard</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="5500.0" />
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

    # 2. ColumbiaPowerPlant
    write_file('src/Data/Columbia/Structures/ColumbiaPowerPlant.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaPowerPlant"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaPowerPlant"
		ButtonImage="Button_ColumbiaPowerPlant"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="650"
		BuildTime="6"
		EnergyProduction="25"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_POWER MP_COUNT_FOR_VICTORY"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaPowerPlant</DisplayName>
		<Description>Desc:ColumbiaPowerPlant</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1400.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="25.0" MinorRadius="25.0" Height="15.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 3. ColumbiaRefinery
    write_file('src/Data/Columbia/Structures/ColumbiaRefinery.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaRefinery"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaRefinery"
		ButtonImage="Button_ColumbiaRefinery"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="2000"
		BuildTime="20"
		EnergyProduction="-6"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS SUPPLY_GATHERING_CENTER MP_COUNT_FOR_VICTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaRefinery</DisplayName>
		<Description>Desc:ColumbiaRefinery</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3200.0" />
		</Body>
		<Behaviors>
			<SupplyWarehouseCripplingBehavior id="ModuleTag_SupplyWarehouseUpdate" />
			<FreeiesBehavior id="ModuleTag_FreeHarvester">
				<FreeObject>ColumbiaHarvester</FreeObject>
			</FreeiesBehavior>
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="45.0" MinorRadius="35.0" Height="30.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 4. ColumbiaBarracks
    write_file('src/Data/Columbia/Structures/ColumbiaBarracks.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaBarracks"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaBarracks"
		ButtonImage="Button_ColumbiaBarracks"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="500"
		BuildTime="5"
		EnergyProduction="-5"
		CommandSet="ColumbiaBarracksCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_FACTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaBarracks</DisplayName>
		<Description>Desc:ColumbiaBarracks</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="2200.0" />
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

    # 5. ColumbiaWarFactory
    write_file('src/Data/Columbia/Structures/ColumbiaWarFactory.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaWarFactory"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaWarFactory"
		ButtonImage="Button_ColumbiaWarFactory"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="2000"
		BuildTime="20"
		EnergyProduction="-7"
		CommandSet="ColumbiaWarFactoryCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_FACTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaWarFactory</DisplayName>
		<Description>Desc:ColumbiaWarFactory</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="4200.0" />
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

    # 6. ColumbiaAirfield
    write_file('src/Data/Columbia/Structures/ColumbiaAirfield.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaAirfield"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaAirfield"
		ButtonImage="Button_ColumbiaAirfield"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="1000"
		BuildTime="10"
		EnergyProduction="-5"
		CommandSet="ColumbiaAirfieldCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_FACTORY AUTO_RALLYPOINT"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaAirfield</DisplayName>
		<Description>Desc:ColumbiaAirfield</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="2600.0" />
		</Body>
		<Behaviors>
			<ProductionUpdate id="ModuleTag_ProductionUpdate" GiveNoXP="true" />
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="40.0" MinorRadius="40.0" Height="20.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 7. ColumbiaTechCenter
    write_file('src/Data/Columbia/Structures/ColumbiaTechCenter.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaTechCenter"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaTechCenter"
		ButtonImage="Button_ColumbiaTechCenter"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="3000"
		BuildTime="30"
		EnergyProduction="-10"
		CommandSet="ColumbiaTechCenterCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_TECH_CENTER"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaTechCenter</DisplayName>
		<Description>Desc:ColumbiaTechCenter</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3600.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="35.0" MinorRadius="35.0" Height="35.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 8. ColumbiaDefenseTurret
    write_file('src/Data/Columbia/Structures/ColumbiaDefenseTurret.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaDefenseTurret"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaDefenseTurret"
		ButtonImage="Button_ColumbiaDefenseTurret"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="800"
		BuildTime="8"
		EnergyProduction="-3"
		WeaponCategory="LASER"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_BASE_DEFENSE ATTACK_NEEDS_LINE_OF_SIGHT CAN_ATTACK"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaDefenseTurret</DisplayName>
		<Description>Desc:ColumbiaDefenseTurret</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="2400.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaTurretCitationLaser" />
				<TurretSettings TurnRate="220" MinPhysicalPitch="-20d" MaxPhysicalPitch="45d">
					<TurretPose X="0.0" Y="0.0" Z="15.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="CYLINDER" MajorRadius="18.0" Height="30.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 9. ColumbiaAA
    write_file('src/Data/Columbia/Structures/ColumbiaAA.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaAA"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaAA"
		ButtonImage="Button_ColumbiaAA"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="750"
		BuildTime="7"
		EnergyProduction="-3"
		WeaponCategory="FORCE"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS FS_BASE_DEFENSE CAN_ATTACK"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaAA</DisplayName>
		<Description>Desc:ColumbiaAA</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1900.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaSonicBattery" />
				<TurretSettings TurnRate="300" MinPhysicalPitch="10d" MaxPhysicalPitch="85d">
					<TurretPose X="0.0" Y="0.0" Z="20.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="CYLINDER" MajorRadius="16.0" Height="25.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 10. ColumbiaSuperweapon
    write_file('src/Data/Columbia/Structures/ColumbiaSuperweapon.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaSuperweapon"
		inheritFrom="BaseStructure"
		SelectPortrait="Portrait_ColumbiaSuperweapon"
		ButtonImage="Button_ColumbiaSuperweapon"
		Side="Columbia"
		EditorSorting="STRUCTURE"
		BuildCost="5000"
		BuildTime="50"
		EnergyProduction="-15"
		CommandSet="ColumbiaSuperweaponCommandSet"
		KindOf="STRUCTURE SELECTABLE IMMOBILE CAN_CAST_REFLECTIONS SUPERWEAPON"
		RadarPriority="STRUCTURE">
		<DisplayName>Name:ColumbiaSuperweapon</DisplayName>
		<Description>Desc:ColumbiaSuperweapon</Description>
		<ArmorSet Armor="ColumbiaHOAStructureArmor" DamageFX="StructureDamageFX" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="6200.0" />
		</Body>
		<Behaviors>
			<SpecialPower id="ModuleTag_MandatoryForeclosureSP" SpecialPowerTemplate="SpecialPower_ColumbiaMandatoryForeclosure" Update="SpecialPowerUpdate_MandatoryForeclosure" />
		</Behaviors>
		<Geometry IsSmall="false">
			<Shape Type="CYLINDER" MajorRadius="30.0" Height="60.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # ==================== COLUMBIA UNITS ====================

    # 1. ColumbiaMCV
    write_file('src/Data/Columbia/Units/ColumbiaMCV.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaMCV"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_ColumbiaMCV"
		ButtonImage="Button_ColumbiaMCV"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="3500"
		BuildTime="35"
		KindOf="SELECTABLE CAN_ATTACK CAN_CAST_REFLECTIONS VEHICLE HUGE_VEHICLE MCV EXPANSION_UNIT"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaPriusWhisperLocomotor">
		<DisplayName>Name:ColumbiaMCV</DisplayName>
		<Description>Desc:ColumbiaMCV</Description>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="5200.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="28.0" MinorRadius="18.0" Height="22.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 2. ColumbiaHarvester
    write_file('src/Data/Columbia/Units/ColumbiaHarvester.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaHarvester"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_ColumbiaHarvester"
		ButtonImage="Button_ColumbiaHarvester"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="1400"
		BuildTime="14"
		KindOf="SELECTABLE CAN_CAST_REFLECTIONS VEHICLE HARVESTER"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaPriusWhisperLocomotor">
		<DisplayName>Name:ColumbiaHarvester</DisplayName>
		<Description>Desc:ColumbiaHarvester</Description>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3400.0" />
		</Body>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="24.0" MinorRadius="14.0" Height="18.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 3. ColumbiaInfantryCyclist
    write_file('src/Data/Columbia/Units/ColumbiaInfantryCyclist.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaInfantryCyclist"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_ColumbiaCyclist"
		ButtonImage="Button_ColumbiaCyclist"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="200"
		BuildTime="2"
		WeaponCategory="GUN"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaPelotonSprintLocomotor">
		<DisplayName>Name:ColumbiaInfantryCyclist</DisplayName>
		<Description>Desc:ColumbiaInfantryCyclist</Description>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="140.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaCyclistBellCharge" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="6.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 4. ColumbiaInfantryOfficer
    write_file('src/Data/Columbia/Units/ColumbiaInfantryOfficer.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaInfantryOfficer"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_ColumbiaOfficer"
		ButtonImage="Button_ColumbiaOfficer"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="350"
		BuildTime="4"
		CommandSet="ColumbiaOfficerCommandSet"
		WeaponCategory="LASER"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaInfantryOfficerLocomotor">
		<DisplayName>Name:ColumbiaInfantryOfficer</DisplayName>
		<Description>Desc:ColumbiaInfantryOfficer</Description>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="240.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaHOATaserBeam" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Behaviors>
			<SpecialPower id="ModuleTag_CitationStunSP" SpecialPowerTemplate="SpecialPower_ColumbiaCitationStun" Update="SpecialPowerUpdate_CitationStun" />
		</Behaviors>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="6.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 5. ColumbiaInfantryPilates
    write_file('src/Data/Columbia/Units/ColumbiaInfantryPilates.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaInfantryPilates"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_ColumbiaPilates"
		ButtonImage="Button_ColumbiaPilates"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="550"
		BuildTime="5"
		WeaponCategory="GUN"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY STEALTH_GARRISON"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaPelotonSprintLocomotor">
		<DisplayName>Name:ColumbiaInfantryPilates</DisplayName>
		<Description>Desc:ColumbiaInfantryPilates</Description>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="200.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaPilatesRingDisc" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="6.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 6. ColumbiaInfantryCommando
    write_file('src/Data/Columbia/Units/ColumbiaInfantryCommando.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaInfantryCommando"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_ColumbiaKaren"
		ButtonImage="Button_ColumbiaKaren"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="1500"
		BuildTime="15"
		WeaponCategory="FORCE"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY UNIQUE_UNIT COMMANDO"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaInfantryOfficerLocomotor">
		<DisplayName>Name:ColumbiaInfantryCommando</DisplayName>
		<Description>Desc:ColumbiaInfantryCommando</Description>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="650.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaKarenMegaphoneScream" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="true">
			<Shape Type="CYLINDER" MajorRadius="7.0" Height="15.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 7. ColumbiaVehiclePrius
    write_file('src/Data/Columbia/Units/ColumbiaVehiclePrius.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaVehiclePrius"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_ColumbiaPrius"
		ButtonImage="Button_ColumbiaPrius"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="800"
		BuildTime="8"
		WeaponCategory="LASER"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaPriusWhisperLocomotor">
		<DisplayName>Name:ColumbiaVehiclePrius</DisplayName>
		<Description>Desc:ColumbiaVehiclePrius</Description>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1000.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaPriusPulseLaser" />
				<TurretSettings TurnRate="260" MinPhysicalPitch="-10d" MaxPhysicalPitch="30d">
					<TurretPose X="0.0" Y="0.0" Z="8.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="15.0" MinorRadius="9.0" Height="10.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 8. ColumbiaVehicleRoundabout
    write_file('src/Data/Columbia/Units/ColumbiaVehicleRoundabout.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaVehicleRoundabout"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_ColumbiaRoundabout"
		ButtonImage="Button_ColumbiaRoundabout"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="1100"
		BuildTime="11"
		WeaponCategory="FORCE"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaPriusWhisperLocomotor">
		<DisplayName>Name:ColumbiaVehicleRoundabout</DisplayName>
		<Description>Desc:ColumbiaVehicleRoundabout</Description>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1400.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaRoundaboutDisruptionBeam" />
				<TurretSettings TurnRate="360" MinPhysicalPitch="0d" MaxPhysicalPitch="40d">
					<TurretPose X="0.0" Y="0.0" Z="10.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="16.0" MinorRadius="12.0" Height="12.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 9. ColumbiaVehicleStreetSweeper
    write_file('src/Data/Columbia/Units/ColumbiaVehicleStreetSweeper.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaVehicleStreetSweeper"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_ColumbiaSweeper"
		ButtonImage="Button_ColumbiaSweeper"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="900"
		BuildTime="9"
		WeaponCategory="GUN"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaSweeperHeavyLocomotor">
		<DisplayName>Name:ColumbiaVehicleStreetSweeper</DisplayName>
		<Description>Desc:ColumbiaVehicleStreetSweeper</Description>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="1600.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaSweeperRotaryBlade" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="18.0" MinorRadius="12.0" Height="14.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 10. ColumbiaVehicleDroneCarrier
    write_file('src/Data/Columbia/Units/ColumbiaVehicleDroneCarrier.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaVehicleDroneCarrier"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_ColumbiaDroneCarrier"
		ButtonImage="Button_ColumbiaDroneCarrier"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="2000"
		BuildTime="20"
		WeaponCategory="GRENADE"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE HUGE_VEHICLE"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaPriusWhisperLocomotor">
		<DisplayName>Name:ColumbiaVehicleDroneCarrier</DisplayName>
		<Description>Desc:ColumbiaVehicleDroneCarrier</Description>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="3200.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotTurret ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaDroneAvocadoBomb" />
				<TurretSettings TurnRate="180" MinPhysicalPitch="10d" MaxPhysicalPitch="60d">
					<TurretPose X="0.0" Y="0.0" Z="12.0" />
				</TurretSettings>
			</WeaponSlotTurret>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="BOX" MajorRadius="25.0" MinorRadius="16.0" Height="16.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    # 11. ColumbiaAircraftDrone
    write_file('src/Data/Columbia/Units/ColumbiaAircraftDrone.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<GameObject
		id="ColumbiaAircraftDrone"
		inheritFrom="BaseAircraft"
		SelectPortrait="Portrait_ColumbiaDrone"
		ButtonImage="Button_ColumbiaDrone"
		Side="Columbia"
		EditorSorting="UNIT"
		BuildCost="1000"
		BuildTime="10"
		WeaponCategory="LASER"
		KindOf="SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS AIRCRAFT"
		RadarPriority="UNIT"
		LocomotorSet="ColumbiaDroneHoverLocomotor">
		<DisplayName>Name:ColumbiaAircraftDrone</DisplayName>
		<Description>Desc:ColumbiaAircraftDrone</Description>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" />
		<Body>
			<ActiveBody id="ModuleTag_Body" MaxHealth="750.0" />
		</Body>
		<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
			<WeaponSlotHardpoint ID="1">
				<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaAirDroneLaser" />
			</WeaponSlotHardpoint>
		</WeaponSetUpdate>
		<Geometry IsSmall="false">
			<Shape Type="CYLINDER" MajorRadius="12.0" Height="6.0" />
		</Geometry>
	</GameObject>
</AssetDeclaration>''')

    print('Columbia assets generated successfully.')

if __name__ == '__main__':
    run()
