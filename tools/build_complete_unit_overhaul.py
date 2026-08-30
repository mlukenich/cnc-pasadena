import os
import shutil
import subprocess

def build_overhaul():
    print("=" * 60)
    print("Building Complete Unit & Structure Overhaul for SAGE Stream...")
    print("=" * 60)

    overhaul_dir = os.path.abspath("ModSDK/Mods/MarylandShowdown/data/Overhaul")
    os.makedirs(overhaul_dir, exist_ok=True)

    # Pasadena Unit Overrides (GDI)
    pasadena_units_xml = """<?xml version="1.0" encoding="utf-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xai="uri:ea.com:eala:asset:instance">
	<Tags></Tags>
	<Includes>
		<Include type="instance" source="DATA:BaseObjects/BaseInfantry.xml" />
		<Include type="instance" source="DATA:BaseObjects/BaseVehicle.xml" />
		<Include type="instance" source="DATA:BaseObjects/BaseStructure.xml" />
	</Includes>

	<!-- Mullet Militia (Replaces GDIRifleSoldier) -->
	<GameObject
		id="GDIRifleSoldier"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_GDIRiflemanSquad"
		ButtonImage="Portrait_GDIRiflemanSquad"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="100"
		BuildTime="1.5"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY PATH_THROUGH_INFANTRY"
		WeaponCategory="GUN"
		Description="DESC:PasadenaMilitia">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaMilitia</DisplayName>
		<ArmorSet Armor="PasadenaInfantryDenimArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="PasadenaInfantryFootLocomotor" Condition="NORMAL" Speed="75" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaMilitiaShotgun" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Waterman Harpooner (Replaces GDIMissileSoldier) -->
	<GameObject
		id="GDIMissileSoldier"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_GDIMissileSoldierSquad"
		ButtonImage="Portrait_GDIMissileSoldierSquad"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="250"
		BuildTime="3.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		WeaponCategory="MISSILE"
		Description="DESC:PasadenaSniper">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaSniper</DisplayName>
		<ArmorSet Armor="PasadenaInfantryDenimArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="PasadenaInfantryFootLocomotor" Condition="NORMAL" Speed="65" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaWatermanHarpoon" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Lawncare Leafblower (Replaces GDIZoneTrooper) -->
	<GameObject
		id="GDIZoneTrooper"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_GDIZoneTrooperSquad"
		ButtonImage="Portrait_GDIZoneTrooperSquad"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="900"
		BuildTime="8.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		WeaponCategory="CANNON"
		Description="DESC:PasadenaLawncare">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaLawncare</DisplayName>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="PasadenaInfantryFootLocomotor" Condition="NORMAL" Speed="60" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaLeafblowerStream" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Salty Bob Commando (Replaces GDICommando) -->
	<GameObject
		id="GDICommando"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_GDICommando"
		ButtonImage="Portrait_GDICommando"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="1500"
		BuildTime="15.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY UNIQUE_UNIT"
		WeaponCategory="GUN"
		Description="DESC:PasadenaCommando">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaCommando</DisplayName>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="PasadenaInfantryFootLocomotor" Condition="NORMAL" Speed="80" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaCommandoMolotov" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Lifted F-250 Super Duty (Replaces GDIPitbull) -->
	<GameObject
		id="GDIPitbull"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_GDIPitbull"
		ButtonImage="Portrait_GDIPitbull"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="650"
		BuildTime="6.0"
		CommandSet="PasadenaDuallyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		WeaponCategory="CANNON"
		Description="DESC:PasadenaF250">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaF250</DisplayName>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="PasadenaLiftedTruckLocomotor" Condition="NORMAL" Speed="110" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotTurret ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaDuallyFiftyCal" />
					<TurretSettings TurretTurnRate="360" AllowsPitch="true" />
				</WeaponSlotTurret>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Backwoods Mud Buggy (Replaces GDIPredator) -->
	<GameObject
		id="GDIPredator"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_GDIPredator"
		ButtonImage="Portrait_GDIPredator"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="900"
		BuildTime="8.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		WeaponCategory="CANNON"
		Description="DESC:PasadenaMudBuggy">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaMudBuggy</DisplayName>
		<ArmorSet Armor="PasadenaRustedSteelArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="PasadenaLiftedTruckLocomotor" Condition="NORMAL" Speed="90" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotTurret ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaBuggyRockets" />
					<TurretSettings TurretTurnRate="180" AllowsPitch="true" />
				</WeaponSlotTurret>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Amphibious Pontoon Barge (Replaces GDIJuggernaught) -->
	<GameObject
		id="GDIJuggernaught"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_GDIJuggernaught"
		ButtonImage="Portrait_GDIJuggernaught"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="1600"
		BuildTime="16.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		WeaponCategory="CANNON"
		Description="DESC:PasadenaPontoonBarge">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaPontoonBarge</DisplayName>
		<ArmorSet Armor="PasadenaFiberglassHullArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="PasadenaPontoonAmphibiousLocomotor" Condition="NORMAL" Speed="55" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotTurret ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaPontoonMortar" />
					<TurretSettings TurretTurnRate="120" AllowsPitch="true" />
				</WeaponSlotTurret>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Old Bay Cropduster (Replaces GDIOrca) -->
	<GameObject
		id="GDIOrca"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_GDIOrca"
		ButtonImage="Portrait_GDIOrca"
		Side="GDI"
		EditorSorting="UNIT"
		BuildCost="1100"
		BuildTime="10.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS AIRCRAFT"
		WeaponCategory="CANNON"
		Description="DESC:PasadenaCropduster">
		<DisplayName xai:joinAction="Replace">NAME:PasadenaCropduster</DisplayName>
		<ArmorSet Armor="PasadenaInfantryDenimArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="PasadenaAircraftFlyLocomotor" Condition="NORMAL" Speed="150" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="PasadenaSeaplaneBomb" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="0s" SinkRate="0" DestructionDelay="1s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>
</AssetDeclaration>
"""
    with open(os.path.join(overhaul_dir, "PasadenaOverhaul.xml"), "w", encoding="utf-8") as fp:
        fp.write(pasadena_units_xml)

    # Columbia Unit Overrides (NOD)
    columbia_units_xml = """<?xml version="1.0" encoding="utf-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xai="uri:ea.com:eala:asset:instance">
	<Tags></Tags>
	<Includes>
		<Include type="instance" source="DATA:BaseObjects/BaseInfantry.xml" />
		<Include type="instance" source="DATA:BaseObjects/BaseVehicle.xml" />
		<Include type="instance" source="DATA:BaseObjects/BaseStructure.xml" />
	</Includes>

	<!-- Peloton Vanguard Cyclist (Replaces NODMilitant) -->
	<GameObject
		id="NODMilitant"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_NODMilitantSquad"
		ButtonImage="Portrait_NODMilitantSquad"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="120"
		BuildTime="1.5"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY PATH_THROUGH_INFANTRY"
		WeaponCategory="LIGHTNING"
		Description="DESC:ColumbiaCyclist">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaCyclist</DisplayName>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="ColumbiaPelotonSprintLocomotor" Condition="NORMAL" Speed="95" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaCyclistBellCharge" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- HOA Compliance Officer (Replaces NODMilitantRocket) -->
	<GameObject
		id="NODMilitantRocket"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_NODMilitantRocketSquad"
		ButtonImage="Portrait_NODMilitantRocketSquad"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="300"
		BuildTime="3.0"
		CommandSet="ColumbiaOfficerCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		WeaponCategory="LIGHTNING"
		Description="DESC:ColumbiaComplianceOfficer">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaComplianceOfficer</DisplayName>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="ColumbiaInfantryOfficerLocomotor" Condition="NORMAL" Speed="70" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaHOATaserBeam" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Pilates Energy Instructor (Replaces NODBlackHand) -->
	<GameObject
		id="NODBlackHand"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_NODBlackHandSquad"
		ButtonImage="Portrait_NODBlackHandSquad"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="800"
		BuildTime="7.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY"
		WeaponCategory="MISSILE"
		Description="DESC:ColumbiaPilates">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaPilates</DisplayName>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="ColumbiaPelotonSprintLocomotor" Condition="NORMAL" Speed="85" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaPilatesRingDisc" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- President Karen Commando (Replaces NODCommando) -->
	<GameObject
		id="NODCommando"
		inheritFrom="BaseInfantry"
		SelectPortrait="Portrait_NODCommando"
		ButtonImage="Portrait_NODCommando"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="1500"
		BuildTime="15.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS INFANTRY UNIQUE_UNIT"
		WeaponCategory="LIGHTNING"
		Description="DESC:ColumbiaCommando">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaCommando</DisplayName>
		<ArmorSet Armor="ColumbiaSpandexInfantryArmor" DamageFX="InfantryDamageFX" />
		<LocomotorSet Locomotor="ColumbiaInfantryOfficerLocomotor" Condition="NORMAL" Speed="80" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaKarenMegaphoneScream" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Prius Patrol Car (Replaces NODBuggy) -->
	<GameObject
		id="NODBuggy"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_NODRaider"
		ButtonImage="Portrait_NODRaider"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="500"
		BuildTime="5.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		WeaponCategory="LIGHTNING"
		Description="DESC:ColumbiaPrius">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaPrius</DisplayName>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="ColumbiaPriusWhisperLocomotor" Condition="NORMAL" Speed="130" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotTurret ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaPriusPulseLaser" />
					<TurretSettings TurretTurnRate="360" AllowsPitch="true" />
				</WeaponSlotTurret>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Lime Scooter Swarm (Replaces NODAttackBike) -->
	<GameObject
		id="NODAttackBike"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_NODAttackBike"
		ButtonImage="Portrait_NODAttackBike"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="600"
		BuildTime="6.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		WeaponCategory="MISSILE"
		Description="DESC:ColumbiaScooter">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaScooter</DisplayName>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="ColumbiaPelotonSprintLocomotor" Condition="NORMAL" Speed="140" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaScooterRocket" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Autonomous Street Sweeper (Replaces NODScorpionBuggy) -->
	<GameObject
		id="NODScorpionBuggy"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_NODScorpionTank"
		ButtonImage="Portrait_NODScorpionTank"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="1000"
		BuildTime="9.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS VEHICLE"
		WeaponCategory="GUN"
		Description="DESC:ColumbiaStreetSweeper">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaStreetSweeper</DisplayName>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="ColumbiaSweeperHeavyLocomotor" Condition="NORMAL" Speed="75" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotTurret ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaSweeperRotaryBlade" />
					<TurretSettings TurretTurnRate="150" AllowsPitch="true" />
				</WeaponSlotTurret>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="3s" SinkRate="2.4" DestructionDelay="4.5s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>

	<!-- Eco-Drone Carrier (Replaces NODVenom) -->
	<GameObject
		id="NODVenom"
		inheritFrom="BaseVehicle"
		SelectPortrait="Portrait_NODVenom"
		ButtonImage="Portrait_NODVenom"
		Side="NOD"
		EditorSorting="UNIT"
		BuildCost="1000"
		BuildTime="9.0"
		CommandSet="EmptyCommandSet"
		KindOf="PRELOAD SELECTABLE CAN_ATTACK ATTACK_NEEDS_LINE_OF_SIGHT CAN_CAST_REFLECTIONS AIRCRAFT"
		WeaponCategory="CANNON"
		Description="DESC:ColumbiaDroneCarrier">
		<DisplayName xai:joinAction="Replace">NAME:ColumbiaDroneCarrier</DisplayName>
		<ArmorSet Armor="ColumbiaLithiumCompositeArmor" DamageFX="VehicleDamageFX" />
		<LocomotorSet Locomotor="ColumbiaDroneHoverLocomotor" Condition="NORMAL" Speed="130" />
		<Behaviors>
			<WeaponSetUpdate id="ModuleTag_WeaponSetUpdate">
				<WeaponSlotHardpoint ID="1">
					<Weapon Ordering="PRIMARY_WEAPON" Template="ColumbiaDroneAvocadoBomb" />
				</WeaponSlotHardpoint>
			</WeaponSetUpdate>
			<SlowDeath id="ModuleTag_Death" SinkDelay="0s" SinkRate="0" DestructionDelay="1s">
				<DieMuxData DeathTypes="ALL" />
			</SlowDeath>
		</Behaviors>
	</GameObject>
</AssetDeclaration>
"""
    with open(os.path.join(overhaul_dir, "ColumbiaOverhaul.xml"), "w", encoding="utf-8") as fp:
        fp.write(columbia_units_xml)

    # Master mod.xml
    mod_xml = """<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags></Tags>
	<Includes>
		<Include type="reference" source="DATA:static.xml" />
		<Include type="reference" source="DATA:global.xml" />

		<!-- Global Game Data -->
		<Include type="all" source="DATA:MarylandShowdown/data/Data/GlobalData/Armor.xml" />
		<Include type="all" source="DATA:MarylandShowdown/data/Data/GlobalData/Weapon.xml" />
		<Include type="all" source="DATA:MarylandShowdown/data/Data/GlobalData/Upgrade.xml" />
		<Include type="all" source="DATA:MarylandShowdown/data/Data/GlobalData/Locomotor.xml" />
		<Include type="all" source="DATA:MarylandShowdown/data/Data/GlobalData/LogicCommand.xml" />
		<Include type="all" source="DATA:MarylandShowdown/data/Data/GlobalData/LogicCommandSet.xml" />
		<Include type="all" source="DATA:MarylandShowdown/data/Data/GlobalData/SoundEvents.xml" />

		<!-- Full Unit Overhaul -->
		<Include type="all" source="DATA:MarylandShowdown/data/Overhaul/PasadenaOverhaul.xml" />
		<Include type="all" source="DATA:MarylandShowdown/data/Overhaul/ColumbiaOverhaul.xml" />
	</Includes>
</AssetDeclaration>
"""
    with open("ModSDK/Mods/MarylandShowdown/data/mod.xml", "w", encoding="utf-8") as fp:
        fp.write(mod_xml)

    print("Master Overhaul files created!")

if __name__ == '__main__':
    build_overhaul()
