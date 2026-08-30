'use strict';

// Validate the compiler output for the Columbia Roundabout Enforcer Tank assets.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { ddsPixel } = require('./test_dually_compiled');

const root = path.resolve(__dirname, '..');
const art = path.join(root, 'src', 'Art', 'CR');
const directory = path.join(root, 'ModSDK', 'BuiltMods', 'mods', 'marylandshowdown', 'data', 'mod', 'assets');
const files = fs.readdirSync(directory);

function asset(type, id) {
  const matches = files.filter(f => f.startsWith(type + '.') && f.split('.')[2] === id);
  assert.equal(matches.length, 1, `Missing/ambiguous asset ${type}:${id}`);
  return fs.readFileSync(path.join(directory, matches[0]));
}

const maps = {
  CRRoundaboutAtlas: '208a52d7',
  CRRoundaboutNormal: 'f44cbfae',
  CRRoundaboutSpec: '5b6446c4',
  CRRoundaboutHouse: 'c3ff0599',
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

const xml = fs.readFileSync(path.join(art, 'CRRoundabout_Model.w3x'), 'utf8');
const entries = [...xml.matchAll(/<W3DMesh id="CRROUNDABOUT_SKIN\.([^"]+)"[\s\S]*?<\/W3DMesh>/g)];
let total = 0;

function section(text, name, tag, count = 3) {
  const block = text.match(new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>'))[1];
  const regex = new RegExp('<' + tag + ' X="([^\"]+)" Y="([^\"]+)"' + (count === 3 ? ' Z="([^\"]+)"' : ''), 'g');
  return [...block.matchAll(regex)].map(m => m.slice(1).map(Number));
}

const meshFiles = files.filter(f => f.startsWith('c2b1a262.'));

for (const entry of entries) {
  const name = entry[1];
  const text = entry[0];
  const vertices = section(text, 'Vertices', 'V');
  const uvs = section(text, 'TexCoords', 'T', 2);
  const normals = section(text, 'Normals', 'N');
  const tangents = section(text, 'Tangents', 'T');
  const binormals = section(text, 'Binormals', 'B');

  const marker = Buffer.alloc(12);
  vertices[0].forEach((v, i) => marker.writeFloatLE(v, i * 4));

  let matchedData = null;
  let start = -1;

  for (const f of meshFiles) {
    const d = fs.readFileSync(path.join(directory, f));
    let pos = 0;
    while ((pos = d.indexOf(marker, pos)) >= 0) {
      if (pos >= 40 && pos + vertices.length * 60 <= d.length && d.readUInt32LE(pos + 24) === 0xffffffff) {
        matchedData = d;
        start = pos;
        break;
      }
      pos += 4;
    }
    if (matchedData) break;
  }
  assert(matchedData, `No compiled vertex buffer found for ${name}`);

  vertices.forEach((position, i) => {
    assert.equal(matchedData.readUInt32LE(start + i * 60 + 24), 0xffffffff, `${name} vertex ${i}: unexpected vertex color tint/alpha`);
    const expected = [...position, ...normals[i], null, ...tangents[i], ...binormals[i], uvs[i][0], 1 - uvs[i][1]];
    expected.forEach((value, k) => {
      if (value === null) return;
      const got = matchedData.readFloatLE(start + i * 60 + k * 4);
      assert(Math.abs(got - value) < 0.00002, `${name} vertex ${i} field ${k}: ${got} vs ${value}`);
    });
  });

  assert(matchedData.includes(Buffer.from('ObjectsGDI.fx')), `${name} compiled mesh missing ObjectsGDI.fx shader reference`);
  total += vertices.length;
}

assert.equal(entries.length, 8, 'Expected 8 compiled meshes');
console.log(`[PASS] test_roundabout_compiled: All 4 material maps and all ${total} compiled vertices verified across 8 meshes.`);
