import os
import shutil
import struct
import io

def encode_csf(strings_dict):
    header = b' FSC'
    version = 3
    num_labels = len(strings_dict)
    num_strings = len(strings_dict)
    unused = 0
    language = 0

    out = bytearray()
    out.extend(header)
    out.extend(struct.pack('<IIIII', version, num_labels, num_strings, unused, language))

    for label, val in strings_dict.items():
        out.extend(b' LBL')
        out.extend(struct.pack('<II', 1, len(label)))
        out.extend(label.encode('ascii'))

        out.extend(b' RTS')
        val_utf16 = val.encode('utf-16le')
        char_len = len(val)
        out.extend(struct.pack('<I', char_len))

        encoded_bytes = bytes([b ^ 0xFF for b in val_utf16])
        out.extend(encoded_bytes)

    return bytes(out)

def create_big_archive(entries_dict, output_big_path):
    entries = []
    for rel_path, data in entries_dict.items():
        norm_path = rel_path.replace('/', '\\')
        entries.append((norm_path, data))

    table_header_size = 16
    table_entries_size = sum(8 + len(name.encode('utf-8')) + 1 for name, _ in entries)
    table_total_size = table_header_size + table_entries_size

    current_offset = table_total_size
    file_table = []
    file_payloads = []

    for name, data in entries:
        size = len(data)
        file_table.append((current_offset, size, name))
        file_payloads.append(data)
        current_offset += size

    total_archive_size = current_offset

    with open(output_big_path, 'wb') as out:
        out.write(b'BIG4')
        out.write(struct.pack('<I', total_archive_size))
        out.write(struct.pack('>I', len(entries)))
        out.write(struct.pack('>I', table_total_size))

        for offset, size, name in file_table:
            out.write(struct.pack('>I', offset))
            out.write(struct.pack('>I', size))
            out.write(name.encode('utf-8') + b'\x00')

        for data in file_payloads:
            out.write(data)

    print(f"Created BIG archive '{output_big_path}' ({len(entries)} files, {total_archive_size} bytes)")

# Master string dictionary for all 118 unit names, descriptions, and superweapons
STRINGS = {
    # Faction Names & Bios
    "INI:FactionGDI": "'Dena Dominion (Pasadena, MD)",
    "INI:FactionNOD": "The Planned Collective (Columbia, MD)",
    "INI:FactionAlien": "Severna Park Yacht Club",
    "GUI:FactionGDI": "'Dena Dominion (Pasadena, MD)",
    "GUI:FactionNOD": "The Planned Collective (Columbia, MD)",
    "GUI:FactionAlien": "Severna Park Yacht Club",
    "GUI:GDI": "'Dena Dominion",
    "GUI:NOD": "The Planned Collective",
    "GUI:Alien": "Severna Park",

    # Skirmish / UI Faction Descriptions
    "GUI:FactionGDI_Desc": "Unregulated lifted horsepower, high-velocity Old Bay mortars, 12-gauge mullet militia, and amphibious pontoon barges.",
    "GUI:FactionNOD_Desc": "Aggressive HOA code compliance, whisper-quiet Prius patrol lasers, Peloton cyclist blitzes, and mandatory foreclosures.",
    "GUI:FactionAlien_Desc": "High-tax catamaran fleets and trust-fund shockwaves.",

    # Pasadena Unit Names
    "NAME:PasadenaMilitia": "Mullet Militia",
    "NAME:PasadenaSniper": "Waterman Harpooner",
    "NAME:PasadenaLawncare": "Lawncare Leafblower",
    "NAME:PasadenaCommando": "Salty Bob ('Dena Commando)",
    "NAME:PasadenaF250": "Lifted F-250 Super Duty",
    "NAME:PasadenaMudBuggy": "Backwoods Mud Buggy",
    "NAME:PasadenaPontoonBarge": "Amphibious Pontoon Barge",
    "NAME:PasadenaJuggernaut": "Mega-Mudder Juggernaut",
    "NAME:PasadenaCropduster": "Old Bay Cropduster",
    "NAME:PasadenaHarvester": "Rusty Scrap Harvester",
    "NAME:PasadenaMCV": "Dually Flatbed MCV",

    # Pasadena Building Names
    "NAME:PasadenaConYard": "Junkyard HQ (ConYard)",
    "NAME:PasadenaPowerPlant": "Unmuffled V8 Generator",
    "NAME:PasadenaRefinery": "Bait & Tackle Scrap Refinery",
    "NAME:PasadenaBarracks": "Garage Workshop (Barracks)",
    "NAME:PasadenaWarFactory": "Speed Shop (War Factory)",
    "NAME:PasadenaAirTower": "Paved Airstrip",
    "NAME:PasadenaTechCenter": "Machine Shed (Tech Center)",
    "NAME:PasadenaWatchTower": "Deer Stand Watch Tower",
    "NAME:PasadenaAntiAir": "Flak Cannon Silo",
    "NAME:PasadenaSuperweapon": "Old Bay Silo (Superweapon)",

    # Columbia Unit Names
    "NAME:ColumbiaCyclist": "Peloton Vanguard Cyclist",
    "NAME:ColumbiaComplianceOfficer": "HOA Compliance Officer",
    "NAME:ColumbiaPilates": "Pilates Energy Instructor",
    "NAME:ColumbiaCommando": "President Karen (HOA Commando)",
    "NAME:ColumbiaPrius": "Prius Patrol Car",
    "NAME:ColumbiaScooter": "Lime Scooter Swarm",
    "NAME:ColumbiaRoundaboutNode": "Roundabout Disruption Node",
    "NAME:ColumbiaStreetSweeper": "Autonomous Street Sweeper",
    "NAME:ColumbiaStealthEV": "Stealth EV Interceptor",
    "NAME:ColumbiaDroneCarrier": "Eco-Drone Mothership",
    "NAME:ColumbiaAirDrone": "Solar Quadcopter Drone",
    "NAME:ColumbiaHarvester": "Zero-Emission Bio-Harvester",
    "NAME:ColumbiaMCV": "Zoning Board Mobile HQ (MCV)",

    # Columbia Building Names
    "NAME:ColumbiaConYard": "Architectural Review Board HQ",
    "NAME:ColumbiaPowerPlant": "Solar Panel Array",
    "NAME:ColumbiaRefinery": "Artisanal Recycling Facility",
    "NAME:ColumbiaBarracks": "Community Fitness Center",
    "NAME:ColumbiaWarFactory": "EV Assembly Plant",
    "NAME:ColumbiaAirTower": "Drone Command Depot",
    "NAME:ColumbiaTechCenter": "HOA Executive Boardroom",
    "NAME:ColumbiaLaserTurret": "HOA Citation Laser Turret",
    "NAME:ColumbiaAntiAir": "Acoustic Noise-Violation Battery",
    "NAME:ColumbiaSuperweapon": "Foreclosure Engine (Superweapon)",

    # In-Game Unit Tooltips
    "DESC:PasadenaMilitia": "Fast-moving light infantry armed with high-spread 12-gauge shotguns.",
    "DESC:PasadenaSniper": "Long-range anti-armor specialist firing high-tension crab pot harpoons.",
    "DESC:PasadenaLawncare": "Fires a continuous high-pressure sonic vortex to knock down infantry.",
    "DESC:PasadenaCommando": "Thick-skinned hero armed with flaming moonshine Molotov cocktails.",
    "DESC:PasadenaF250": "Heavy anti-vehicle pickup truck. Can activate Rolling Coal smoke screen.",
    "DESC:PasadenaMudBuggy": "High-mobility off-road scout firing rapid unguided mortar volleys.",
    "DESC:PasadenaPontoonBarge": "Amphibious fire support platform that traverses both land and water.",
    "DESC:PasadenaJuggernaut": "Colossal monster truck armed with quad supercharged bass subwoofers.",
    "DESC:PasadenaCropduster": "Low-flying biplane dropping aerosolized Old Bay chemical canisters.",
    "DESC:ColumbiaCyclist": "High-speed spandex scout. Rings bicycle bell to disorient enemies.",
    "DESC:ColumbiaComplianceOfficer": "Fires non-lethal HOA stun tasers to incapacitate combatants.",
    "DESC:ColumbiaPilates": "Hurls high-velocity aerodynamic pilates discs that bounce between targets.",
    "DESC:ColumbiaCommando": "Fierce HOA president whose megaphone scream paralyzes opposing forces.",
    "DESC:ColumbiaPrius": "Whisper-quiet electric scout armed with rapid pinpoint pulse lasers.",
    "DESC:ColumbiaScooter": "Hyper-fast swarm vehicle equipped with anti-armor micro rockets.",
    "DESC:ColumbiaRoundaboutNode": "Generates a localized electromagnetic pulse grid that stalls vehicles.",
    "DESC:ColumbiaStreetSweeper": "Cleans the battlefield with rotating titanium shredder blades.",
    "DESC:ColumbiaDroneCarrier": "Deploys precision solar attack drones from long range.",

    # Superweapons
    "NAME:AbilityOldBayCataclysm": "Old Bay Super-Storm",
    "DESC:AbilityOldBayCataclysm": "Blankets the entire target sector in spicy aerosolized crab seasoning.",
    "NAME:AbilityMandatoryForeclosure": "Mandatory Foreclosure Strike",
    "DESC:AbilityMandatoryForeclosure": "Issues immediate demolition citations, disintegrating target structures.",

    # Vanilla Replacement Mappings for full in-game HUD coverage
    "NAME:GDIRifleSoldier": "Mullet Militia",
    "DESC:GDIRifleSoldier": "Fast-moving light infantry armed with high-spread 12-gauge shotguns.",
    "NAME:GDIMissileSoldier": "Waterman Harpooner",
    "DESC:GDIMissileSoldier": "Long-range anti-armor specialist firing high-tension crab pot harpoons.",
    "NAME:GDIZoneTrooper": "Lawncare Leafblower Crew",
    "DESC:GDIZoneTrooper": "Fires a continuous high-pressure sonic vortex to knock down infantry.",
    "NAME:GDICommando": "Salty Bob ('Dena Commando)",
    "DESC:GDICommando": "Thick-skinned hero armed with flaming moonshine Molotov cocktails.",
    "NAME:GDIPitbull": "Lifted F-250 Super Duty",
    "DESC:GDIPitbull": "Heavy anti-vehicle pickup truck with dual high-caliber cannons.",
    "NAME:GDIPredator": "Backwoods Mud Buggy",
    "DESC:GDIPredator": "High-mobility off-road scout firing rapid unguided mortar volleys.",
    "NAME:GDIAirfield": "Paved Airstrip",
    "NAME:GDIBarracks": "Garage Workshop (Barracks)",
    "NAME:GDIWarFactory": "Speed Shop (War Factory)",
    "NAME:GDIConstructionYard": "Junkyard HQ (ConYard)",

    "NAME:NODMilitant": "Peloton Vanguard Cyclist",
    "DESC:NODMilitant": "High-speed spandex scout. Rings bicycle bell to disorient enemies.",
    "NAME:NODMilitantRocket": "HOA Compliance Officer",
    "DESC:NODMilitantRocket": "Fires non-lethal HOA stun tasers to incapacitate combatants.",
    "NAME:NODBlackHand": "Pilates Energy Instructor",
    "DESC:NODBlackHand": "Hurls high-velocity aerodynamic pilates discs that bounce between targets.",
    "NAME:NODCommando": "President Karen (HOA Commando)",
    "DESC:NODCommando": "Fierce HOA president whose megaphone scream paralyzes opposing forces.",
    "NAME:NODAttackBike": "Lime Scooter Swarm",
    "DESC:NODAttackBike": "Hyper-fast swarm vehicle equipped with anti-armor micro rockets.",
    "NAME:NODBuggy": "Prius Patrol Car",
    "DESC:NODBuggy": "Whisper-quiet electric scout armed with rapid pinpoint pulse lasers.",
    "NAME:NODScorpionBuggy": "Autonomous Street Sweeper",
    "DESC:NODScorpionBuggy": "Cleans the battlefield with rotating titanium shredder blades.",
    "NAME:NODAirTower": "Drone Command Depot",
    "NAME:NODBarracks": "Community Fitness Center",
    "NAME:NODWarFactory": "EV Assembly Plant",
    "NAME:NODConstructionYard": "Architectural Review Board HQ"
}

def build_all():
    print("=" * 60)
    print("Building Maryland Showdown Complete In-Game Conversion")
    print("=" * 60)

    # 1. Compile CSF binary
    csf_binary = encode_csf(STRINGS)

    # 2. Build mod.str
    mod_str_lines = []
    for k, v in STRINGS.items():
        mod_str_lines.append(f"{k}\n\"{v}\"\nEnd\n")
    mod_str_content = "\n".join(mod_str_lines)

    # 3. Assemble Misc big entries
    misc_entries = {}

    # String files in all required locations
    misc_entries['data\\mod.str'] = mod_str_content.encode('latin1')
    misc_entries['data\\mod.csf'] = csf_binary
    misc_entries['data\\cnc3.csf'] = csf_binary
    misc_entries['cnc3.csf'] = csf_binary
    misc_entries['lang-english\\cnc3.csf'] = csf_binary

    # playertemplate.ini
    playertemplate_ini = """;//////////////////////////////////////////////////////////////////////////////
;FILE: PlayerTemplate.ini (SYSTEM) - Maryland Showdown Mod
;//////////////////////////////////////////////////////////////////////////////

#define RESOURCE_MODIFIER_OBJECT_FILTER NONE

PlayerTemplate FactionRandom
	IsRandom          = Yes
	Side              = Null
	PlayableSide      = No
	IsObserver        = No
	IntrinsicSciences = None
	DisplayName       = GUI:RandomSide
	SideIconImage     = GameinfoRANDOM
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
End

PlayerTemplate FactionObserver
	Side              = Observer
	PlayableSide      = No
	IsObserver        = Yes
	StartMoney        = 0
	PreferredColor    = R:255 G:255 B:255
	PreferredCampaignRadarColor = R:255 G:255 B:255
	IntrinsicSciences = None
	DisplayName       = INI:FactionObserver
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenImage   = Mp_Load
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_Unknown
	BeaconName        = MultiplayerBeacon
	SideIconImage     = GameinfoOBSRVR
End

PlayerTemplate FactionCommentator
	Side              = Commentator
	PlayableSide      = No
	IsObserver        = Yes
	IsCommentator     = Yes
	StartMoney        = 0
	PreferredColor    = R:64 G:64 B:64
	PreferredCampaignRadarColor = R:64 G:64 B:64
	IntrinsicSciences = None
	DisplayName       = INI:FactionCommentator
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenImage   = Mp_Load
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_Unknown
	BeaconName        = MultiplayerBeacon
	SideIconImage     = GameinfoCOMMENTATOR
End

PlayerTemplate FactionCivilian
	Side              = Civilian
	PlayableSide      = No
	StartMoney        = 0
	PreferredColor    = R:128 G:128 B:128
	PreferredCampaignRadarColor = R:128 G:128 B:128
	IntrinsicSciences = None
	DisplayName       = INI:FactionCivilian
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_Unknown
End

PlayerTemplate FactionNeutral
	Side              = Neutral
	PlayableSide      = No
	StartMoney        = 0
	PreferredColor    = R:192 G:192 B:192
	PreferredCampaignRadarColor = R:192 G:192 B:192
	IntrinsicSciences = None
	DisplayName       = INI:FactionNeutral
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_Unknown
End

PlayerTemplate FactionGDI
	Side              			= GDI
	PlayableSide      			= Yes
	StartMoney        			= 10000
	MaxLevelMP					= 32
	MaxLevelSP					= 78
	PreferredColor				= R:230 G:75 B:25
	PreferredCampaignRadarColor	= R:230 G:75 B:25
	StartingBuilding			= GDIConstructionYard	
	PurchaseScienceCommandSet	= GoodSpellStoreCommandSet
	PurchaseScienceCommandSetMP	= MenSpellStoreCommandSet
	DisplayName					= INI:FactionGDI
	DefaultPlayerAIType			= MenSkirmishAI
	BeaconName					= MultiplayerBeacon
	LoadScreenMusic				= TEMP_RAM_Music360_LoadScreen
	SkirmishMPVictoryMusic		= CNC3_SUCCESS
	SkirmishMPDefeatMusic		= CNC3_FAILURE	
	IntelDBMusic				= Music_BaseBuilding_Blue
	InitialUpgrades				= Upgrade_GDIFaction
	ResourceModifierObjectFilter = RESOURCE_MODIFIER_OBJECT_FILTER
	ResourceModifierValues		= 100 100 100 100 100 100 95 90 85 80 75 71 68 66
	MoneyCapSP					= 3000
	MoneyCapMP					= 3000
	SpellBook					= PlayerSpellBook
	SpellBookMp					= PlayerSpellBook
End

PlayerTemplate FactionNOD
	Side              			= NOD
	PlayableSide      			= Yes
	StartMoney        			= 10000
	MaxLevelMP					= 32
	MaxLevelSP					= 78
	PreferredColor				= R:50 G:180 B:120
	PreferredCampaignRadarColor	= R:50 G:180 B:120
	StartingBuilding			= NODConstructionYard	
	PurchaseScienceCommandSet	= GoodSpellStoreCommandSet
	PurchaseScienceCommandSetMP	= MenSpellStoreCommandSet
	DisplayName					= INI:FactionNOD
	DefaultPlayerAIType			= MenSkirmishAI
	BeaconName					= MultiplayerBeacon
	LoadScreenMusic				= TEMP_RAM_Music360_LoadScreen
	SkirmishMPVictoryMusic		= CNC3_SUCCESS_EVIL
	SkirmishMPDefeatMusic		= CNC3_FAILURE	
	IntelDBMusic				= Music_BaseBuilding_Yellow
	InitialUpgrades				= Upgrade_NODFaction
	ResourceModifierObjectFilter = RESOURCE_MODIFIER_OBJECT_FILTER
	ResourceModifierValues		= 100 100 100 100 100 100 95 90 85 80 75 71 68 66
	MoneyCapSP					= 3000
	MoneyCapMP					= 3000
	SpellBook					= PlayerSpellBook
	SpellBookMp					= PlayerSpellBook
End

PlayerTemplate FactionAlien
	Side              			= Alien
	PlayableSide      			= Yes
	StartMoney        			= 10000
	MaxLevelMP					= 32
	MaxLevelSP					= 78
	PreferredColor				= R:160 G:60 B:200
	PreferredCampaignRadarColor	= R:160 G:60 B:200
	StartingBuilding			= AlienDronePlatform	
	PurchaseScienceCommandSet	= GoodSpellStoreCommandSet
	PurchaseScienceCommandSetMP	= MenSpellStoreCommandSet
	DisplayName					= INI:FactionAlien
	DefaultPlayerAIType			= MenSkirmishAI
	BeaconName					= MultiplayerBeacon
	LoadScreenMusic				= TEMP_RAM_Music360_LoadScreen
	SkirmishMPVictoryMusic		= CNC3_SUCCESS_EVIL
	SkirmishMPDefeatMusic		= CNC3_FAILURE	
	IntelDBMusic				= Music_BaseBuilding_Red
	InitialUpgrades				= Upgrade_AlienFaction
	ResourceModifierObjectFilter = RESOURCE_MODIFIER_OBJECT_FILTER
	ResourceModifierValues		= 100 100 100 100 100 100 95 90 85 80 75 71 68 66
	MoneyCapSP					= 10000
	MoneyCapMP					= 10000
	SpellBook					= PlayerSpellBook
	SpellBookMp					= PlayerSpellBook
End
"""
    misc_entries['data\\ini\\playertemplate.ini'] = playertemplate_ini.encode('latin1')

    # Read all src/ files into data/
    for root, _, files in os.walk('src'):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, 'src')
            with open(full_p, 'rb') as fp:
                content = fp.read()
            misc_entries[f"data\\{rel_p}"] = content

    misc_out = 'build/MarylandShowdown_1.0_Misc.big'
    create_big_archive(misc_entries, misc_out)

    # 4. SkuDef definition
    skudef_content = """mod-game 1.9
add-big MarylandShowdown_1.0_Streams.big
add-big MarylandShowdown_1.0_Misc.big
"""
    with open('build/MarylandShowdown_1.0.skudef', 'w', encoding='utf-8') as f:
        f.write(skudef_content)

    print("\nMisc big built successfully!")

if __name__ == '__main__':
    build_all()
