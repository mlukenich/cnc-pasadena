import os
import shutil
import struct

def deploy_all():
    print("=" * 60)
    print("Deploying Universal Maryland Showdown Mod...")
    print("=" * 60)

    os.makedirs('build', exist_ok=True)

    # 1. Build Universal Stream (with both mod and static stream manifests)
    from build_dual_stream import build_universal_stream
    build_universal_stream()

    # 2. Build Misc BIG (CSF Strings + INI tables)
    from build_perfect_mod import build_all
    build_all()

    streams_out = 'build/MarylandShowdown_1.0_Streams.big'
    misc_out = 'build/MarylandShowdown_1.0_Misc.big'
    skudef_out = 'build/MarylandShowdown_1.0.skudef'

    # 3. Deploy to all user Mod directories
    target_base_dirs = [
        r"C:\Users\mluke\OneDrive\Documents\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\OneDrive\Documents\Command and Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Documents\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Documents\Command and Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\Saved Games\Command & Conquer 3 Tiberium Wars\Mods",
        r"C:\Users\mluke\AppData\Roaming\Command & Conquer 3 Tiberium Wars\Mods"
    ]

    for base in target_base_dirs:
        dest = os.path.join(base, "MarylandShowdown")
        os.makedirs(dest, exist_ok=True)
        shutil.copy2(streams_out, os.path.join(dest, "MarylandShowdown_1.0_Streams.big"))
        shutil.copy2(misc_out, os.path.join(dest, "MarylandShowdown_1.0_Misc.big"))
        shutil.copy2(skudef_out, os.path.join(dest, "MarylandShowdown_1.0.skudef"))
        print(f"Deployed to: {dest}")

    # 4. Also copy directly to Game Install folder
    game_dir = r"C:\Program Files\EA Games\Command and Conquer 3 TW and KW\Command Conquer 3 Tiberium Wars"
    if os.path.exists(game_dir):
        try:
            shutil.copy2(streams_out, os.path.join(game_dir, "MarylandShowdown_1.0_Streams.big"))
            shutil.copy2(misc_out, os.path.join(game_dir, "MarylandShowdown_1.0_Misc.big"))
            print(f"Directly updated game install files in: {game_dir}")
        except Exception as e:
            print(f"Notice: Direct copy to Program Files requires UAC: {e}")

    print("\n[SUCCESS] Universal Mod deployment complete!")

if __name__ == '__main__':
    deploy_all()
