'use strict';

// Validate the compiler output for the Pasadena Monster Mud Tank assets.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { ddsPixel } = require('./test_dually_compiled');

const root = path.resolve(__dirname, '..');
const art = path.join(root, 'src', 'Art', 'PM');
const directory = path.join(root, 'ModSDK', 'BuiltMods', 'mods', 'marylandshowdown', 'data', 'mod', 'assets');
const files = fs.readdirSync(directory);

function asset(type, id) {
  const matches = files.filter(f => f.startsWith(type + '.') && f.split('.')[2] === id);
  assert.equal(matches.length, 1, `Missing/ambiguous asset ${type}:${id}`);
  return fs.readFileSync(path.join(directory, matches[0]));
}

const maps = {
  PVMudTankAtlas: 'c8e1e9d6',
  PVMudTankNormal: '3bf455aa',
  PVMudTankSpec: '2ab356e8',
  PVMudTankHouse: '5acd251d',
};

for (const [name, id] of Object.entries(maps)) {
  const data = asset('21e727da', id);
  const source = fs.readFileSync(path.join(art, name + '.tga'));
  const size = source.readUInt16LE(12);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = Math.floor((col + 0.5) * size / 4);
      const y = Math.floor((row + 0.5) * size / 4);
      const p = 18 + (y * size + x) * 4;
      const expected = [source[p + 2], source[p + 1], source[p], source[p + 3]];
      const actual = ddsPixel(data, x, y);
      actual.forEach((v, k) => {
        assert(Math.abs(v - expected[k]) <= 32, `${name}: compiled pixel (${x},${y}) differs in channel ${k}: ${v} vs ${expected[k]}`);
      });
    }
  }
}

const meshIds = {
  BODY: '8b7a8e2d',
  TURRET: '109a062f',
  BARREL: '7c469019',
  TIRE_LF: '895f6c68',
  TIRE_RF: 'b764f575',
  TIRE_LR: '93c1b5cf',
  TIRE_RR: 'bebf6cb6',
};

const xml = fs.readFileSync(path.join(art, 'PVMudTank_Model.w3x'), 'utf8');
const entries = [...xml.matchAll(/<W3DMesh id="PVMUDTANK_SKIN\.([^"]+)"[\s\S]*?<\/W3DMesh>/g)];
let total = 0;

function section(text, name, tag, count = 3) {
  const block = text.match(new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>'))[1];
  const regex = new RegExp('<' + tag + ' X="([^\"]+)" Y="([^\"]+)"' + (count === 3 ? ' Z="([^\"]+)"' : ''), 'g');
  return [...block.matchAll(regex)].map(m => m.slice(1).map(Number));
}

for (const entry of entries) {
  const name = entry[1];
  const text = entry[0];
  const id = meshIds[name];
  assert(id, `No known asset ID for mesh ${name}`);

  const vertices = section(text, 'Vertices', 'V');
  const uvs = section(text, 'TexCoords', 'T', 2);
  const normals = section(text, 'Normals', 'N');
  const tangents = section(text, 'Tangents', 'T');
  const binormals = section(text, 'Binormals', 'B');

  const compiled = asset('c2b1a262', id);
  const marker = Buffer.alloc(12);
  vertices[0].forEach((v, i) => marker.writeFloatLE(v, i * 4));

  const start = compiled.indexOf(marker);
  assert(start >= 0, `Could not locate vertex stream in compiled mesh ${name}`);
  assert(start + vertices.length * 60 <= compiled.length, `Truncated vertex buffer on ${name}`);

  vertices.forEach((position, i) => {
    assert.equal(compiled.readUInt32LE(start + i * 60 + 24), 0xffffffff, `${name} vertex ${i}: unexpected vertex color tint/alpha`);
    const expected = [...position, ...normals[i], null, ...tangents[i], ...binormals[i], uvs[i][0], 1 - uvs[i][1]];
    expected.forEach((value, k) => {
      if (value === null) return;
      const got = compiled.readFloatLE(start + i * 60 + k * 4);
      assert(Math.abs(got - value) < 0.00002, `${name} vertex ${i} field ${k}: ${got} vs ${value}`);
    });
  });

  assert(compiled.includes(Buffer.from('ObjectsGDI.fx')), `${name} compiled mesh missing ObjectsGDI.fx shader reference`);
  total += vertices.length;
}

assert.equal(entries.length, 7, 'Expected 7 compiled meshes');
console.log(`[PASS] test_mudtank_compiled: All 4 material maps and all ${total} compiled vertices verified across 7 meshes.`);
