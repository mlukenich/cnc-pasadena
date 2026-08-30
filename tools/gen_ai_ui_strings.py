import os

def write_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Wrote: {filepath}')

def run():
    # 1. AIPersonality_Pasadena.xml
    write_file('src/Data/AI/AIPersonality_Pasadena.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<AIPersonalityDefinition
		id="PasadenaSkirmishAI"
		PersonalityType="PasadenaSkirmishAI"
		BaseRefinery="PasadenaRefinery"
		BaseBarracks="PasadenaBarracks"
		BaseFactory="PasadenaWarFactory"
		BaseAirfield="PasadenaAirfield"
		BasePower="PasadenaPowerPlant"
		BaseTechCenter="PasadenaTechCenter"
		BaseSuperweapon="PasadenaSuperweapon"
		BasicHarvester="PasadenaHarvester"
		BasicMCV="PasadenaMCV"
		UnitBuilder="PasadenaWarFactory"
		StructureBuilder="PasadenaConYard"
		UnitBuilderBarracks="PasadenaBarracks"
		SkirmishAI="true">
		<Side>Pasadena</Side>
		<StrategicState id="PasadenaEarlyRushState" State="PasadenaEarlyRush" Weight="80" />
		<StrategicState id="PasadenaDieselConvoyState" State="PasadenaDieselConvoy" Weight="90" />
		<StrategicState id="PasadenaOldBayBombardState" State="PasadenaOldBayBombard" Weight="100" />
		<BuildDelay MinDelay="1.0s" MaxDelay="3.0s" />
	</AIPersonalityDefinition>
</AssetDeclaration>''')

    # 2. AIPersonality_Columbia.xml
    write_file('src/Data/AI/AIPersonality_Columbia.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<AIPersonalityDefinition
		id="ColumbiaSkirmishAI"
		PersonalityType="ColumbiaSkirmishAI"
		BaseRefinery="ColumbiaRefinery"
		BaseBarracks="ColumbiaBarracks"
		BaseFactory="ColumbiaWarFactory"
		BaseAirfield="ColumbiaAirfield"
		BasePower="ColumbiaPowerPlant"
		BaseTechCenter="ColumbiaTechCenter"
		BaseSuperweapon="ColumbiaSuperweapon"
		BasicHarvester="ColumbiaHarvester"
		BasicMCV="ColumbiaMCV"
		UnitBuilder="ColumbiaWarFactory"
		StructureBuilder="ColumbiaConYard"
		UnitBuilderBarracks="ColumbiaBarracks"
		SkirmishAI="true">
		<Side>Columbia</Side>
		<StrategicState id="ColumbiaZoningDefenseState" State="ColumbiaZoningDefense" Weight="85" />
		<StrategicState id="ColumbiaPriusSwarmState" State="ColumbiaPriusSwarm" Weight="90" />
		<StrategicState id="ColumbiaForeclosureStrikeState" State="ColumbiaForeclosureStrike" Weight="100" />
		<BuildDelay MinDelay="1.0s" MaxDelay="2.5s" />
	</AIPersonalityDefinition>
</AssetDeclaration>''')

    # 3. AIStrategicStates.xml
    write_file('src/Data/AI/AIStrategicStates.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<AIStrategicStateDefinition id="PasadenaEarlyRush">
		<TargetHeuristic TargetType="EnemyStructure" Priority="100" />
		<RecruitUnit Unit="PasadenaInfantryMilitia" Count="8" />
		<RecruitUnit Unit="PasadenaVehicleBuggy" Count="4" />
	</AIStrategicStateDefinition>

	<AIStrategicStateDefinition id="PasadenaDieselConvoy">
		<TargetHeuristic TargetType="EnemyVehicle" Priority="90" />
		<RecruitUnit Unit="PasadenaVehicleDually" Count="6" />
		<RecruitUnit Unit="PasadenaVehiclePontoon" Count="3" />
		<RecruitUnit Unit="PasadenaVehicleMonster" Count="2" />
	</AIStrategicStateDefinition>

	<AIStrategicStateDefinition id="PasadenaOldBayBombard">
		<TargetHeuristic TargetType="EnemyConYard" Priority="120" />
		<RecruitUnit Unit="PasadenaVehiclePontoon" Count="5" />
		<RecruitUnit Unit="PasadenaAircraftSeaplane" Count="4" />
	</AIStrategicStateDefinition>

	<AIStrategicStateDefinition id="ColumbiaZoningDefense">
		<TargetHeuristic TargetType="FriendlyStructure" Priority="100" />
		<RecruitUnit Unit="ColumbiaDefenseTurret" Count="4" />
		<RecruitUnit Unit="ColumbiaAA" Count="3" />
		<RecruitUnit Unit="ColumbiaInfantryOfficer" Count="4" />
	</AIStrategicStateDefinition>

	<AIStrategicStateDefinition id="ColumbiaPriusSwarm">
		<TargetHeuristic TargetType="EnemyHarvester" Priority="110" />
		<RecruitUnit Unit="ColumbiaVehiclePrius" Count="8" />
		<RecruitUnit Unit="ColumbiaVehicleRoundabout" Count="2" />
		<RecruitUnit Unit="ColumbiaInfantryCyclist" Count="6" />
	</AIStrategicStateDefinition>

	<AIStrategicStateDefinition id="ColumbiaForeclosureStrike">
		<TargetHeuristic TargetType="EnemySuperweapon" Priority="130" />
		<RecruitUnit Unit="ColumbiaVehicleDroneCarrier" Count="4" />
		<RecruitUnit Unit="ColumbiaAircraftDrone" Count="6" />
		<RecruitUnit Unit="ColumbiaInfantryPilates" Count="4" />
	</AIStrategicStateDefinition>
</AssetDeclaration>''')

    # 4. CommandBar.xml
    write_file('src/Data/UI/CommandBar.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<CommandBarTemplate id="PasadenaCommandBar">
		<Color R="230" G="75" B="25" />
		<BackgroundTexture>Pasadena_HUD_Background</BackgroundTexture>
		<ButtonSkinNormal>Pasadena_Button_Normal</ButtonSkinNormal>
		<ButtonSkinPressed>Pasadena_Button_Pressed</ButtonSkinPressed>
	</CommandBarTemplate>

	<CommandBarTemplate id="ColumbiaCommandBar">
		<Color R="50" G="180" B="120" />
		<BackgroundTexture>Columbia_HUD_Background</BackgroundTexture>
		<ButtonSkinNormal>Columbia_Button_Normal</ButtonSkinNormal>
		<ButtonSkinPressed>Columbia_Button_Pressed</ButtonSkinPressed>
	</CommandBarTemplate>
</AssetDeclaration>''')

    # 5. InGameUI.xml
    write_file('src/Data/UI/InGameUI.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Tags/>
	<Includes/>
	<InGameUIFactionSetting
		id="PasadenaInGameUI"
		Side="Pasadena"
		MinimapBackgroundColor="R:15 G:10 B:8"
		RadarColor="R:230 G:75 B:25"
		CursorColor="R:255 G:120 B:30" />

	<InGameUIFactionSetting
		id="ColumbiaInGameUI"
		Side="Columbia"
		MinimapBackgroundColor="R:8 G:14 B:12"
		RadarColor="R:50 G:180 B:120"
		CursorColor="R:70 G:220 B:160" />
</AssetDeclaration>''')

    # 6. LocalizedStrings/strings.xml
    write_file('src/LocalizedStrings/strings.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<StringTable>
	<!-- Faction Names & Lore -->
	<String id="GUI:FactionPasadena">The 'Dena Dominion</String>
	<String id="GUI:FactionPasadenaDescription">Pasadena, MD - The proud blue-collar kingdom of the Chesapeake. Armed with straight-pipe diesel trucks, commercial lawncare equipment, bushel baskets of steamed crabs, and weaponized Old Bay seasoning.</String>
	<String id="GUI:FactionColumbia">The Columbia Planned Collective</String>
	<String id="GUI:FactionColumbiaDescription">Columbia, MD - The meticulously planned HOA utopia. Features whisper-silent electric vehicle swarms, code-compliance citation stun beams, aggressive bicycle pelotons, organic co-op drone carriers, and orbital zoning foreclosures.</String>

	<!-- Pasadena Structures -->
	<String id="Name:PasadenaConYard">Crab Shack Command HQ</String>
	<String id="Desc:PasadenaConYard">Central operational headquarters. Adorned with glowing neon crab signs and picnic tables. Coordinates base construction.</String>
	<String id="Name:PasadenaPowerPlant">Straight-Pipe Diesel Generator</String>
	<String id="Desc:PasadenaPowerPlant">Loud, un-muffled twin turbo diesel generator. Supplies immense dirty power to the base while irritating neighbors for miles.</String>
	<String id="Name:PasadenaRefinery">Crab Steamer &amp; Scrap Depot</String>
	<String id="Desc:PasadenaRefinery">Processes local raw resources into cash. Automatically deploys a Bayside Scrap &amp; Crab Dredger.</String>
	<String id="Name:PasadenaBarracks">VFW Hall &amp; Bait Shop</String>
	<String id="Desc:PasadenaBarracks">Recruits and trains Pasadena infantry. Stocked with cheap beer, frozen bait, and crab mallets.</String>
	<String id="Name:PasadenaWarFactory">Bayside Custom Garage</String>
	<String id="Desc:PasadenaWarFactory">Fabricates lifted trucks, mud buggies, pontoon battle barges, and monster trucks.</String>
	<String id="Name:PasadenaAirfield">Seaplane &amp; Cropduster Dock</String>
	<String id="Desc:PasadenaAirfield">A rickety wooden pier with fueling pumps. Deploys custom cropduster seaplanes.</String>
	<String id="Name:PasadenaTechCenter">Speedboat Tuning &amp; Speed Shop</String>
	<String id="Desc:PasadenaTechCenter">Unlocks advanced high-horsepower upgrades, lift kits, and the Crab Feast rally ability.</String>
	<String id="Name:PasadenaDefenseTurret">Crab Pot &amp; Potato Cannon</String>
	<String id="Desc:PasadenaDefenseTurret">Pneumatic heavy turret that hurls cast-iron crab pots and frozen spuds at incoming ground targets.</String>
	<String id="Name:PasadenaAA">Duck Hunter Blind</String>
	<String id="Desc:PasadenaAA">Camouflaged wetland blind packed with 10-gauge magnum shotguns and flak cannons.</String>
	<String id="Name:PasadenaSuperweapon">Old Bay Industrial Silo</String>
	<String id="Desc:PasadenaSuperweapon">Contains pressurized containers of ultra-potent Maryland seasoning capable of blinding and corroding entire battlefields.</String>

	<!-- Pasadena Units -->
	<String id="Name:PasadenaMCV">Heavy Duty Flatbed Rig</String>
	<String id="Desc:PasadenaMCV">Massive commercial flatbed hauler. Deploys into the Crab Shack Command HQ.</String>
	<String id="Name:PasadenaHarvester">Bayside Scrap &amp; Crab Dredger</String>
	<String id="Desc:PasadenaHarvester">Rugged diesel truck equipped with hydraulic claw dredges to haul resources back to the Steamer.</String>
	<String id="Name:PasadenaInfantryMilitia">Mullet Militia</String>
	<String id="Desc:PasadenaInfantryMilitia">Local patriots armed with double-barrel 12-gauges and oak crab mallets. Fearless and loud.</String>
	<String id="Name:PasadenaInfantryLeafblower">Lawncare Guerilla</String>
	<String id="Desc:PasadenaInfantryLeafblower">Equipped with a 2-stroke commercial backpack leafblower. Blasts acoustic shockwaves and toxic gas fumes, knocking back infantry.</String>
	<String id="Name:PasadenaInfantryWaterman">Waterman Sniper</String>
	<String id="Desc:PasadenaInfantryWaterman">Hardened Chesapeake oyster-shucker armed with a pneumatic high-velocity harpoon rifle.</String>
	<String id="Name:PasadenaInfantryCommando">Captain 'Salty Bob'</String>
	<String id="Desc:PasadenaInfantryCommando">Legendary waterman hero. Dual-wields sawed-off shotguns and hurls flaming bottles of Natty Boh molotovs.</String>
	<String id="Name:PasadenaVehicleDually">Lifted F-250 'Rolling Coal'</String>
	<String id="Desc:PasadenaVehicleDually">Twin .50 caliber heavy gun truck on a 10-inch lift. Ability: 'Rolling Coal' covers the area in dense black smog.</String>
	<String id="Name:PasadenaVehicleBuggy">Chesapeake Mud Buggy</String>
	<String id="Desc:PasadenaVehicleBuggy">Lightweight tubular rollcage buggy armed with twin bottle rockets. Fast harasser.</String>
	<String id="Name:PasadenaVehiclePontoon">Pontoon Battle Barge</String>
	<String id="Desc:PasadenaVehiclePontoon">Amphibious floating fortress with dual heavy crabpot mortars. Shells targets on land and water alike.</String>
	<String id="Name:PasadenaVehicleMonster">The Monster Mudder Juggernaut</String>
	<String id="Desc:PasadenaVehicleMonster">66-inch tractor tires that crush enemy light vehicles, equipped with a 5,000-watt tailgate subwoofer shockwave.</String>
	<String id="Name:PasadenaAircraftSeaplane">Rusty Cropduster</String>
	<String id="Desc:PasadenaAircraftSeaplane">Low-flying aerial bomber that carpet-bombs targets with volatile fuel drums.</String>

	<!-- Columbia Structures -->
	<String id="Name:ColumbiaConYard">Master HOA Community Center</String>
	<String id="Desc:ColumbiaConYard">Sleek, architectural-digest-approved modern facility. Manages all zoning and neighborhood infrastructure.</String>
	<String id="Name:ColumbiaPowerPlant">Solar Farm &amp; Kinetic Gym Hub</String>
	<String id="Desc:ColumbiaPowerPlant">Clean energy array powered by rooftop solar glass and 100 synchronized spin bikes.</String>
	<String id="Name:ColumbiaRefinery">Organic Co-op Distribution Hub</String>
	<String id="Desc:ColumbiaRefinery">Processes regional resources into fair-trade revenue. Automatically deploys a Zero-Emission Co-op Rover.</String>
	<String id="Name:ColumbiaBarracks">Fitness &amp; Yoga Studio</String>
	<String id="Desc:ColumbiaBarracks">Trains hyper-fit cyclists, Pilates operatives, and HOA code enforcement inspectors.</String>
	<String id="Name:ColumbiaWarFactory">Clean Tech EV Fabrication Plant</String>
	<String id="Desc:ColumbiaWarFactory">State-of-the-art sterile manufacturing floor for electric Priuses, sweepers, and autonomous carriers.</String>
	<String id="Name:ColumbiaAirfield">Drone Logistics Skyport</String>
	<String id="Desc:ColumbiaAirfield">Automated flight deck for high-precision autonomous grocery delivery attack drones.</String>
	<String id="Name:ColumbiaTechCenter">Urban Planning &amp; Zoning Commission</String>
	<String id="Desc:ColumbiaTechCenter">Researches Kevlar Spandex, Lithium battery overcharge, and unlocks the Roundabout Gridlock ability.</String>
	<String id="Name:ColumbiaDefenseTurret">Automated HOA Citation Laser</String>
	<String id="Desc:ColumbiaDefenseTurret">High-precision diode laser that vaporizes unauthorized color schemes and non-compliant intruders.</String>
	<String id="Name:ColumbiaAA">Noise-Complaint Acoustic Battery</String>
	<String id="Desc:ColumbiaAA">Dishes out 140-decibel directed sound pulses at aircraft violating town quiet hours.</String>
	<String id="Name:ColumbiaSuperweapon">Zoning Board Orbital Foreclosure Array</String>
	<String id="Desc:ColumbiaSuperweapon">Orbital satellite system that issues immediate mass foreclosure orders, disintegrating target structures.</String>

	<!-- Columbia Units -->
	<String id="Name:ColumbiaMCV">Autonomous Modular Capsule</String>
	<String id="Desc:ColumbiaMCV">Zero-emissions mobile headquarters. Deploys into the Master HOA Community Center.</String>
	<String id="Name:ColumbiaHarvester">Zero-Emission Co-op Cargo Rover</String>
	<String id="Desc:ColumbiaHarvester">Whisper-quiet autonomous rover that collects resources without disturbing suburban tranquility.</String>
	<String id="Name:ColumbiaInfantryCyclist">Peloton Cyclist</String>
	<String id="Desc:ColumbiaInfantryCyclist">Hyper-aggressive road cyclist in aerodynamic Lycra. Rings annoying high-frequency titanium bells that disorient foes.</String>
	<String id="Name:ColumbiaInfantryOfficer">HOA Compliance Inspector</String>
	<String id="Desc:ColumbiaInfantryOfficer">Armed with a clipboard and a citation taser that temporarily freezes enemy units for minor aesthetic violations.</String>
	<String id="Name:ColumbiaInfantryPilates">Pilates Spec Ops</String>
	<String id="Desc:ColumbiaInfantryPilates">Stealth infiltration specialist. Throws razor-sharp weighted Pilates rings and captures enemy buildings.</String>
	<String id="Name:ColumbiaInfantryCommando">HOA President 'Karen'</String>
	<String id="Desc:ColumbiaInfantryCommando">The supreme authority of the subdivision. Uses a high-gain megaphone sonic scream to devastate enemy squads.</String>
	<String id="Name:ColumbiaVehiclePrius">Prius Patrol EV</String>
	<String id="Desc:ColumbiaVehiclePrius">Whisper-silent electric cruiser armed with rapid-pulse laser diodes and kinetic energy shielding.</String>
	<String id="Name:ColumbiaVehicleRoundabout">Roundabout Node</String>
	<String id="Desc:ColumbiaVehicleRoundabout">Emits electromagnetic traffic-calming waves that trap enemy units in infinite circular pathfinding loops.</String>
	<String id="Name:ColumbiaVehicleStreetSweeper">Autonomous Street Sweeper</String>
	<String id="Desc:ColumbiaVehicleStreetSweeper">High-speed rotary steel brushes that grind infantry and debris into pristine asphalt.</String>
	<String id="Name:ColumbiaVehicleDroneCarrier">Whole Foods Delivery Platform</String>
	<String id="Desc:ColumbiaVehicleDroneCarrier">Heavy hover platform that launches autonomous attack drones armed with explosive organic avocados.</String>
	<String id="Name:ColumbiaAircraftDrone">Organic Co-op Precision Drone</String>
	<String id="Desc:ColumbiaAircraftDrone">Agile quadcopter armed with surgical surgical lasers for perimeter enforcement.</String>

	<!-- Abilities & Upgrades -->
	<String id="NAME:SpecialPower_RollingCoal">Rolling Coal Smog Screen</String>
	<String id="DESC:SpecialPower_RollingCoal">Emits a dense cloud of black diesel exhaust that breaks missile lock-ons and blinds nearby enemies.</String>
	<String id="NAME:SpecialPower_CrabFeast">Bayside Crab Feast Rally</String>
	<String id="DESC:SpecialPower_CrabFeast">Feeds nearby units fresh steamed blue crabs, boosting movement speed and weapon damage by 30%.</String>
	<String id="NAME:SpecialPower_OldBayCataclysm">Old Bay Cataclysm</String>
	<String id="DESC:SpecialPower_OldBayCataclysm">Unleashes a massive aerosol storm of spicy Old Bay seasoning across the target area.</String>
	<String id="NAME:SpecialPower_CitationStun">HOA Code Citation</String>
	<String id="DESC:SpecialPower_CitationStun">Issues an immediate code violation, disabling the target vehicle or structure.</String>
	<String id="NAME:SpecialPower_RoundaboutGridlock">Roundabout Gridlock</String>
	<String id="DESC:SpecialPower_RoundaboutGridlock">Traps all enemy units in the target zone inside an unavoidable electromagnetic traffic circle.</String>
	<String id="NAME:SpecialPower_MandatoryForeclosure">Mandatory HOA Foreclosure</String>
	<String id="DESC:SpecialPower_MandatoryForeclosure">Orbital particle strike that tears down non-compliant structures and revokes neighborhood residency.</String>
	<String id="Upgrade:PasadenaLiftKit">6-Inch Lift Kits</String>
	<String id="Upgrade:PasadenaLiftKitDescription">Equips all Pasadena vehicles with off-road suspension, allowing them to ignore terrain penalties.</String>
	<String id="Upgrade:PasadenaOldBaySeasoning">Old Bay Weapon Coating</String>
	<String id="Upgrade:PasadenaOldBaySeasoningDescription">Adds spicy corrosive damage to all Pasadena bullets, harpoons, and mortar shells.</String>
	<String id="Upgrade:PasadenaStraightPipes">Straight-Pipe Exhausts</String>
	<String id="Upgrade:PasadenaStraightPipesDescription">Increases engine loudness, intimidating nearby enemy infantry.</String>
	<String id="Upgrade:ColumbiaKevlarSpandex">Kevlar Spandex Weave</String>
	<String id="Upgrade:ColumbiaKevlarSpandexDescription">Reinforces Columbia infantry fitness apparel with ballistic nanofibers.</String>
	<String id="Upgrade:ColumbiaLithiumBatteryPack">Solid-State Lithium Packs</String>
	<String id="Upgrade:ColumbiaLithiumBatteryPackDescription">Doubles the energy shield capacity of Prius Patrols and Whole Foods drone platforms.</String>
	<String id="Upgrade:ColumbiaHOAZoningCertification">Master HOA Certification</String>
	<String id="Upgrade:ColumbiaHOAZoningCertificationDescription">Streamlines neighborhood permits, increasing structure repair speed by 35%.</String>
</StringTable>''')

    # 7. LocalizedStrings/en-us.str
    write_file('src/LocalizedStrings/en-us.str', '''// C&C 3 Pasadena vs Columbia Localized String Table
GUI:FactionPasadena
"The 'Dena Dominion"
END

GUI:FactionPasadenaDescription
"Pasadena, MD - The proud blue-collar kingdom of the Chesapeake. Armed with straight-pipe diesel trucks, commercial lawncare equipment, bushel baskets of steamed crabs, and weaponized Old Bay seasoning."
END

GUI:FactionColumbia
"The Columbia Planned Collective"
END

GUI:FactionColumbiaDescription
"Columbia, MD - The meticulously planned HOA utopia. Features whisper-silent electric vehicle swarms, code-compliance citation stun beams, aggressive bicycle pelotons, organic co-op drone carriers, and orbital zoning foreclosures."
END
''')

    print('AI, UI, and string assets generated successfully.')

if __name__ == '__main__':
    run()
