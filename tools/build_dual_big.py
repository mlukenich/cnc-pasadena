import os
import shutil
import struct

def create_big_archive(entries_dict, output_big_path):
    """
    Packs a dictionary of {rel_path: bytes} into an EA SAGE BIG4 archive.
    """
    entries = []
    for rel_path, data in entries_dict.items():
        # Ensure path uses backslashes
        norm_path = rel_path.replace('/', '\\')
        entries.append((norm_path, data))

    # Header size: Magic (4) + TotalSize (4) + NumFiles (4) + TableSize (4) = 16 bytes
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

def build_mod():
    print("Building full SAGE dual-archive mod...")

    # 1. Streams big (Binary stream runtime)
    source_streams_big = 'tools/TiberiumWarsVersion/60FPSAndNoSW/60FPSAndNoSW_1.02_Streams.big'
    if not os.path.exists(source_streams_big):
        print("Error: Source streams big not found!")
        return

    os.makedirs('build', exist_ok=True)
    streams_output = 'build/MarylandShowdown_1.0_Streams.big'
    shutil.copy2(source_streams_big, streams_output)
    print(f"Generated {streams_output}")

    # 2. Misc big (INI overrides, localized strings, scripts, XML definitions)
    misc_entries = {}

    # Read all src/ files into misc_entries with prefix 'data/'
    for root, _, files in os.walk('src'):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, 'src')
            with open(full_p, 'rb') as fp:
                content = fp.read()
            misc_entries[f"data\\{rel_p}"] = content

    # Add playertemplate.ini
    playertemplate_ini = """// PlayerTemplate.ini for Maryland Showdown Mod
// Replaces & enhances factions for full skirmish compatibility

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
	SideIconImage     = GameinfoOBSERVER
End

PlayerTemplate FactionCivilian
	Side              = Civilian
	PlayableSide      = No
	IsObserver        = No
	StartMoney        = 0
	PreferredColor    = R:255 G:255 B:255
	PreferredCampaignRadarColor = R:255 G:255 B:255
	IntrinsicSciences = None
	DisplayName       = INI:FactionCivilian
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenImage   = Mp_Load
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_Unknown
	BeaconName        = MultiplayerBeacon
	SideIconImage     = GameinfoCIVILIAN
End

PlayerTemplate FactionGDI
	Side              = GDI
	PlayableSide      = Yes
	StartMoney        = 10000
	PreferredColor    = R:230 G:75 B:25
	PreferredCampaignRadarColor = R:230 G:75 B:25
	IntrinsicSciences = None
	DisplayName       = GUI:FactionPasadena
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenImage   = Mp_Load
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_GDI
	BeaconName        = MultiplayerBeacon
	SideIconImage     = GameinfoGDI
	StartingBuilding  = GDIPowerPlant
	StartingUnit1     = GDIMCV
	StartingUnitPosition1 = X:0 Y:0 Z:0
	InitialBuildable  = GDIPowerPlant
End

PlayerTemplate FactionNOD
	Side              = NOD
	PlayableSide      = Yes
	StartMoney        = 10000
	PreferredColor    = R:50 G:180 B:120
	PreferredCampaignRadarColor = R:50 G:180 B:120
	IntrinsicSciences = None
	DisplayName       = GUI:FactionColumbia
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenImage   = Mp_Load
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_NOD
	BeaconName        = MultiplayerBeacon
	SideIconImage     = GameinfoNOD
	StartingBuilding  = NODPowerPlant
	StartingUnit1     = NODMCV
	StartingUnitPosition1 = X:0 Y:0 Z:0
	InitialBuildable  = NODPowerPlant
End

PlayerTemplate FactionAlien
	Side              = Alien
	PlayableSide      = Yes
	StartMoney        = 10000
	PreferredColor    = R:160 G:60 B:200
	PreferredCampaignRadarColor = R:160 G:60 B:200
	IntrinsicSciences = None
	DisplayName       = GUI:FactionMoCo
	ScoreScreenImage  = MutiPlayer_ScoreScreen
	LoadScreenImage   = Mp_Load
	LoadScreenMusic	  = TEMP_RAM_Music360_LoadScreen
	IntelDBMusic	  = Music_BaseBuilding_Alien
	BeaconName        = MultiplayerBeacon
	SideIconImage     = GameinfoALIEN
	StartingBuilding  = AlienPowerProjector
	StartingUnit1     = AlienMCV
	StartingUnitPosition1 = X:0 Y:0 Z:0
	InitialBuildable  = AlienPowerProjector
End
"""
    misc_entries["data\\ini\\playertemplate.ini"] = playertemplate_ini.encode('latin1')

    # Add mod.str (Master localized strings)
    mod_str = """// Maryland Showdown Localized Strings
GUI:FactionPasadena
"The 'Dena Dominion (Pasadena, MD)"
End

GUI:FactionColumbia
"The Columbia Planned Collective (Columbia, MD)"
End

GUI:FactionMoCo
"MoCo Commuters (Montgomery County)"
End

GUI:FactionGDI
"The 'Dena Dominion (Pasadena, MD)"
End

GUI:FactionNOD
"The Columbia Planned Collective (Columbia, MD)"
End

GUI:FactionAlien
"MoCo Commuters (Montgomery County)"
End

GUI:GDI_Desc
"Pasadena, MD - Waterman grit, straight-pipe diesel horsepower, crab shacks, lifted trucks, and Old Bay artillery."
End

GUI:NOD_Desc
"Columbia, MD - Master-planned HOA paradise, silent EV swarms, citation stun beams, organic co-ops, and strict zoning laws."
End

GUI:Alien_Desc
"Montgomery County - Beltway gridlock, speed camera laser batteries, metro delays, and property tax orbital superweapons."
End

NAME:SpecialPower_RollingCoal
"Rolling Coal Smog Screen"
End

DESC:SpecialPower_RollingCoal
"Emits a dense cloud of black diesel exhaust that breaks missile lock-ons and blinds nearby enemies."
End

NAME:SpecialPower_CrabFeast
"Bayside Crab Feast Rally"
End

DESC:SpecialPower_CrabFeast
"Feeds nearby units fresh steamed blue crabs, boosting movement speed and weapon damage by 30%."
End

NAME:SpecialPower_OldBayCataclysm
"Old Bay Cataclysm"
End

DESC:SpecialPower_OldBayCataclysm
"Unleashes a massive aerosol storm of spicy Old Bay seasoning across the target area."
End

NAME:SpecialPower_CitationStun
"HOA Code Citation"
End

DESC:SpecialPower_CitationStun
"Issues an immediate code violation, disabling the target vehicle or structure."
End

NAME:SpecialPower_RoundaboutGridlock
"Roundabout Gridlock"
End

DESC:SpecialPower_RoundaboutGridlock
"Traps all enemy units in the target zone inside an unavoidable electromagnetic traffic circle."
End

NAME:SpecialPower_MandatoryForeclosure
"Mandatory HOA Foreclosure"
End

DESC:SpecialPower_MandatoryForeclosure
"Orbital particle strike that tears down non-compliant structures and revokes neighborhood residency."
End
"""
    misc_entries["data\\mod.str"] = mod_str.encode('latin1')

    misc_output = 'build/MarylandShowdown_1.0_Misc.big'
    create_big_archive(misc_entries, misc_output)

    # 3. Skudef definition
    skudef_content = """mod-game 1.9
add-big MarylandShowdown_1.0_Streams.big
add-big MarylandShowdown_1.0_Misc.big
"""
    skudef_path = 'build/MarylandShowdown_1.0.skudef'
    with open(skudef_path, 'w', encoding='utf-8') as f:
        f.write(skudef_content)

    # 4. Deploy to all candidate directories
    target_base_dirs = [
        r"C:\Users\mluke\OneDrive\Documents\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\OneDrive\Documents\Command and Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Documents\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Documents\Command and Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Saved Games\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\AppData\Roaming\Command & Conquer 3 Tiberium Wars\Mods"
    ]

    for base in target_base_dirs:
        try:
            dest = os.path.join(base, "MarylandShowdown")
            os.makedirs(dest, exist_ok=True)

            shutil.copy2(streams_output, os.path.join(dest, "MarylandShowdown_1.0_Streams.big"))
            shutil.copy2(misc_output, os.path.join(dest, "MarylandShowdown_1.0_Misc.big"))
            shutil.copy2(skudef_path, os.path.join(dest, "MarylandShowdown_1.0.skudef"))
            print(f"Deployed complete mod package to: {dest}")
        except Exception as e:
            print(f"Error deploying to {base}: {e}")

    print("\n[SUCCESS] SAGE Engine dual-archive mod built & deployed successfully!")

if __name__ == '__main__':
    build_mod()
