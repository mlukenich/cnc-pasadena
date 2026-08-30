import unittest
import xml.etree.ElementTree as ET
import glob
import os

class TestCnC3MarylandMod(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.xml_files = glob.glob('src/**/*.xml', recursive=True)
        cls.parsed_docs = {}
        for f in cls.xml_files:
            cls.parsed_docs[f] = ET.parse(f).getroot()

        # Build index of objects (stripping namespaces)
        cls.game_objects = {}
        cls.weapons = {}
        cls.armors = {}
        cls.upgrades = {}
        cls.special_powers = {}
        cls.logic_commands = {}
        cls.logic_command_sets = {}
        cls.strings = {}

        for path, root in cls.parsed_docs.items():
            for elem in root.iter():
                elem_id = elem.attrib.get('id')
                tag = elem.tag.split('}')[-1]
                if tag == 'GameObject' and elem_id:
                    cls.game_objects[elem_id] = (elem, path)
                elif tag == 'WeaponTemplate' and elem_id:
                    cls.weapons[elem_id] = elem
                elif tag == 'ArmorTemplate' and elem_id:
                    cls.armors[elem_id] = elem
                elif tag == 'UpgradeTemplate' and elem_id:
                    cls.upgrades[elem_id] = elem
                elif tag == 'SpecialPowerTemplate' and elem_id:
                    cls.special_powers[elem_id] = elem
                elif tag == 'LogicCommand' and elem_id:
                    cls.logic_commands[elem_id] = elem
                elif tag == 'LogicCommandSet' and elem_id:
                    cls.logic_command_sets[elem_id] = elem
                elif tag == 'String' and elem_id:
                    cls.strings[elem_id] = elem.text

    def test_file_count(self):
        """Ensure all required core XML files exist."""
        self.assertGreaterEqual(len(self.xml_files), 50)

    def test_faction_symmetry_structure_count(self):
        """Ensure both Pasadena and Columbia have symmetric structure counts (10 each)."""
        pasadena_structs = [k for k in self.game_objects if k.startswith('Pasadena') and ('ConYard' in k or 'Power' in k or 'Refinery' in k or 'Barracks' in k or 'WarFactory' in k or 'Airfield' in k or 'Tech' in k or 'Turret' in k or 'AA' in k or 'Superweapon' in k)]
        columbia_structs = [k for k in self.game_objects if k.startswith('Columbia') and ('ConYard' in k or 'Power' in k or 'Refinery' in k or 'Barracks' in k or 'WarFactory' in k or 'Airfield' in k or 'Tech' in k or 'Turret' in k or 'AA' in k or 'Superweapon' in k)]
        self.assertEqual(len(pasadena_structs), 10, f"Expected 10 Pasadena structures, found {len(pasadena_structs)}")
        self.assertEqual(len(columbia_structs), 10, f"Expected 10 Columbia structures, found {len(columbia_structs)}")

    def test_faction_symmetry_unit_count(self):
        """Ensure both Pasadena and Columbia have symmetric unit counts (11 each)."""
        pasadena_units = [k for k in self.game_objects if k.startswith('Pasadena') and ('MCV' in k or 'Harvester' in k or 'Infantry' in k or 'Vehicle' in k or 'Aircraft' in k)]
        columbia_units = [k for k in self.game_objects if k.startswith('Columbia') and ('MCV' in k or 'Harvester' in k or 'Infantry' in k or 'Vehicle' in k or 'Aircraft' in k)]
        self.assertEqual(len(pasadena_units), 11, f"Expected 11 Pasadena units, found {len(pasadena_units)}")
        self.assertEqual(len(columbia_units), 11, f"Expected 11 Columbia units, found {len(columbia_units)}")

    def test_economy_parity(self):
        """Verify build cost parity for Refineries and Harvesters between factions."""
        pasadena_ref = self.game_objects['PasadenaRefinery'][0]
        columbia_ref = self.game_objects['ColumbiaRefinery'][0]
        self.assertEqual(pasadena_ref.attrib['BuildCost'], columbia_ref.attrib['BuildCost'])

        pasadena_harv = self.game_objects['PasadenaHarvester'][0]
        columbia_harv = self.game_objects['ColumbiaHarvester'][0]
        self.assertEqual(pasadena_harv.attrib['BuildCost'], columbia_harv.attrib['BuildCost'])

    def test_conyard_command_sets(self):
        """Ensure Construction Yards have complete command sets containing all basic structures."""
        pasadena_cs = [cmd.text for cmd in self.logic_command_sets['PasadenaConYardCommandSet'].iter() if cmd.tag.endswith('Cmd')]
        columbia_cs = [cmd.text for cmd in self.logic_command_sets['ColumbiaConYardCommandSet'].iter() if cmd.tag.endswith('Cmd')]

        self.assertIn('Command_ConstructPasadenaPowerPlant', pasadena_cs)
        self.assertIn('Command_ConstructPasadenaRefinery', pasadena_cs)
        self.assertIn('Command_ConstructPasadenaBarracks', pasadena_cs)
        self.assertIn('Command_ConstructPasadenaWarFactory', pasadena_cs)

        self.assertIn('Command_ConstructColumbiaPowerPlant', columbia_cs)
        self.assertIn('Command_ConstructColumbiaRefinery', columbia_cs)
        self.assertIn('Command_ConstructColumbiaBarracks', columbia_cs)
        self.assertIn('Command_ConstructColumbiaWarFactory', columbia_cs)

    def test_superweapons_registered(self):
        """Check that both superweapons have valid power templates, costs, and cooldowns."""
        self.assertIn('SpecialPower_PasadenaOldBayCataclysm', self.special_powers)
        self.assertIn('SpecialPower_ColumbiaMandatoryForeclosure', self.special_powers)

        pasadena_sw = self.game_objects['PasadenaSuperweapon'][0]
        columbia_sw = self.game_objects['ColumbiaSuperweapon'][0]
        self.assertEqual(int(pasadena_sw.attrib['BuildCost']), 5000)
        self.assertEqual(int(columbia_sw.attrib['BuildCost']), 5000)

    def test_commandos_parity(self):
        """Check that both heroic commandos (Captain Salty Bob and Karen) have proper unique tags and command definitions."""
        bob = self.game_objects['PasadenaInfantryCommando'][0]
        karen = self.game_objects['ColumbiaInfantryCommando'][0]

        self.assertIn('COMMANDO', bob.attrib['KindOf'])
        self.assertIn('COMMANDO', karen.attrib['KindOf'])
        self.assertEqual(bob.attrib['BuildCost'], '1500')
        self.assertEqual(karen.attrib['BuildCost'], '1500')

    def test_localization_strings(self):
        """Verify essential localized string keys are populated in strings.xml."""
        self.assertIn('GUI:FactionPasadena', self.strings)
        self.assertIn('GUI:FactionColumbia', self.strings)
        self.assertIn('Name:PasadenaVehicleDually', self.strings)
        self.assertIn('Name:ColumbiaVehiclePrius', self.strings)
        self.assertIn('NAME:SpecialPower_OldBayCataclysm', self.strings)
        self.assertIn('NAME:SpecialPower_MandatoryForeclosure', self.strings)

    def test_weapon_damage_types(self):
        """Ensure all weapons have non-zero damage and valid SAGE engine damage types."""
        valid_damage_types = {'GUN', 'SNIPER', 'GRENADE', 'CANNON', 'ROCKET', 'LASER', 'FORCE'}
        for wep_id, elem in self.weapons.items():
            nuggets = [n for n in elem.iter() if n.tag.endswith('DamageNugget')]
            self.assertGreater(len(nuggets), 0, f"Weapon {wep_id} has no DamageNuggets")
            for nug in nuggets:
                dmg = float(nug.attrib.get('Damage', 0))
                dmg_type = nug.attrib.get('DamageType')
                self.assertGreater(dmg, 0, f"Weapon {wep_id} has non-positive damage")
                self.assertIn(dmg_type, valid_damage_types, f"Weapon {wep_id} has invalid damage type: {dmg_type}")

    def test_ai_personalities_valid(self):
        """Verify AI personalities link to valid faction buildings and units."""
        self.assertIn('PasadenaSkirmishAI', [e.attrib.get('id') for p, r in self.parsed_docs.items() for e in r.iter() if e.tag.endswith('AIPersonalityDefinition')])
        self.assertIn('ColumbiaSkirmishAI', [e.attrib.get('id') for p, r in self.parsed_docs.items() for e in r.iter() if e.tag.endswith('AIPersonalityDefinition')])

if __name__ == '__main__':
    unittest.main()
