import os
import shutil

def patch_core():
    print("=" * 60)
    print("Direct Core Engine Patching for C&C 3 (EA App / Retail)...")
    print("=" * 60)

    game_dir = r"C:\Program Files\EA Games\Command and Conquer 3 TW and KW\Command Conquer 3 Tiberium Wars"
    build_dir = os.path.abspath("build")

    streams_big = os.path.join(build_dir, "MarylandShowdown_1.0_Streams.big")
    misc_big = os.path.join(build_dir, "MarylandShowdown_1.0_Misc.big")

    if not os.path.exists(streams_big) or not os.path.exists(misc_big):
        print("Error: Build files missing!")
        return

    # Target folders to inject BIG files
    dest_folders = [
        game_dir,
        os.path.join(game_dir, "Core", "1.9"),
        os.path.join(game_dir, "Core", "1.10"),
        os.path.join(game_dir, "Core", "1.0"),
        os.path.join(game_dir, "RetailExe", "1.9"),
        os.path.join(game_dir, "RetailExe", "1.10")
    ]

    for d in dest_folders:
        if os.path.exists(d):
            try:
                shutil.copy2(streams_big, os.path.join(d, "MarylandShowdown_1.0_Streams.big"))
                shutil.copy2(misc_big, os.path.join(d, "MarylandShowdown_1.0_Misc.big"))
                print(f"[OK] Injected BIGs into: {d}")
            except Exception as e:
                print(f"[ERR] Copy to {d} failed: {e}")

    # Patch Core config.txt files
    core_configs = [
        os.path.join(game_dir, "Core", "1.9", "config.txt"),
        os.path.join(game_dir, "Core", "1.10", "config.txt"),
        os.path.join(game_dir, "Core", "1.0", "config.txt")
    ]

    for cfg in core_configs:
        if os.path.exists(cfg):
            bak = cfg + ".bak"
            if not os.path.exists(bak):
                shutil.copy2(cfg, bak)
            
            with open(bak, "r", encoding="latin1") as f:
                content = f.read()

            lines = [l for l in content.splitlines() if "MarylandShowdown" not in l]
            new_lines = [
                "add-big MarylandShowdown_1.0_Streams.big",
                "add-big MarylandShowdown_1.0_Misc.big"
            ] + lines

            with open(cfg, "w", encoding="latin1") as f:
                f.write("\n".join(new_lines) + "\n")
            print(f"[OK] Patched Core config: {cfg}")

    # Patch ALL SkuDef files
    for item in os.listdir(game_dir):
        if item.endswith(".SkuDef") and not item.endswith(".bak"):
            sku_path = os.path.join(game_dir, item)
            bak = sku_path + ".bak"
            if not os.path.exists(bak):
                shutil.copy2(sku_path, bak)
            
            with open(bak, "r", encoding="latin1") as f:
                content = f.read()

            lines = [l for l in content.splitlines() if "MarylandShowdown" not in l]
            new_lines = []
            for l in lines:
                if "add-search-path big:" in l:
                    new_lines.append("add-big MarylandShowdown_1.0_Streams.big")
                    new_lines.append("add-big MarylandShowdown_1.0_Misc.big")
                new_lines.append(l)

            with open(sku_path, "w", encoding="latin1") as f:
                f.write("\n".join(new_lines) + "\n")
            print(f"[OK] Patched SkuDef: {sku_path}")

    print("\n[SUCCESS] Engine successfully patched with 100% direct core injection!")

if __name__ == '__main__':
    patch_core()
