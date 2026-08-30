import os
import shutil
import subprocess
from build_complete_unit_overhaul import build_overhaul

def setup_and_compile():
    print("=" * 60)
    print("Setting up Maryland Showdown in ModSDK...")
    print("=" * 60)

    mod_name = "MarylandShowdown"
    mod_sdk_dir = os.path.abspath("ModSDK")
    mod_target_dir = os.path.join(mod_sdk_dir, "Mods", mod_name, "data")
    os.makedirs(mod_target_dir, exist_ok=True)

    # 1. Copy src/ files into ModSDK/Mods/MarylandShowdown/data/
    for item in os.listdir("src"):
        src_path = os.path.join("src", item)
        dst_path = os.path.join(mod_target_dir, item)
        if os.path.isdir(src_path):
            if os.path.exists(dst_path):
                shutil.rmtree(dst_path)
            shutil.copytree(src_path, dst_path)
        else:
            shutil.copy2(src_path, dst_path)

    # 2. Build the complete overhaul
    build_overhaul()

    # 3. Copy mod.str
    if os.path.exists("src/LocalizedStrings/en-us.str"):
        shutil.copy2("src/LocalizedStrings/en-us.str", os.path.join(mod_target_dir, "mod.str"))

    # 4. Invoke BuildMod.bat MarylandShowdown
    print("\n[COMPILING] Running BinaryAssetBuilder on MarylandShowdown...")
    cmd = [os.path.join(mod_sdk_dir, "BuildMod.bat"), mod_name]
    res = subprocess.run(cmd, cwd=mod_sdk_dir, capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print("[STDERR]", res.stderr)

    # 5. Check if MarylandShowdown.big was created
    built_big = os.path.join(mod_sdk_dir, "BuiltMods", "mods", f"{mod_name}.big")
    if os.path.exists(built_big):
        print(f"\n[SUCCESS] Compiled {built_big} ({os.path.getsize(built_big)} bytes)")

if __name__ == '__main__':
    setup_and_compile()
