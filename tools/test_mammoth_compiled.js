'use strict';

// Validate the compiler output for the Pasadena Monster Mudder Juggernaut assets.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { ddsPixel } = require('./test_dually_compiled');

const root = path.resolve(__dirname, '..');
const art = path.join(root, 'src', 'Art', 'PJ');
const directory = path.join(root, 'ModSDK', 'BuiltMods', 'mods', 'marylandshowdown', 'data', 'mod', 'assets');
const files = fs.existsSync(directory) ? fs.readdirSync(directory) : [];

function asset(type, id) {
  const matches = files.filter(f => f.startsWith(type + '.') && f.split('.')[2] === id);
  assert.equal(matches.length, 1, `Missing/ambiguous asset ${type}:${id}`);
  return fs.readFileSync(path.join(directory, matches[0]));
}

const mapNames = ['PJMammothAtlas', 'PJMammothNormal', 'PJMammothSpec', 'PJMammothHouse'];

if (files.length > 0) {
  const textFiles = files.filter(f => f.startsWith('21e727da.'));
  const meshFiles = files.filter(f => f.startsWith('c2b1a262.'));

  // Test maps by ID
  const mapIds = {
    PJMammothAtlas: 'e8138aac',
    PJMammothNormal: 'f8e4790d',
    PJMammothSpec: 'cfd4c0a3',
    PJMammothHouse: '97334c93',
  };

  mapNames.forEach(name => {
    const id = mapIds[name];
    const matched = textFiles.filter(f => f.includes(`.${id}.`));
    assert.equal(matched.length, 1, `Could not locate compiled texture asset for ${name} (id ${id})`);
    const data = fs.readFileSync(path.join(directory, matched[0]));
    assert(data.length > 500000, `Compiled texture ${name} too small (${data.length} bytes)`);
  });

  const xml = fs.readFileSync(path.join(art, 'PJMammoth_Model.w3x'), 'utf8');
  const entries = [...xml.matchAll(/<W3DMesh id="PJMAMMOTH_SKIN\.([^"]+)"[\s\S]*?<\/W3DMesh>/g)];
  let total = 0;

  function section(text, name, tag, count = 3) {
    const block = text.match(new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>'))[1];
    const regex = new RegExp('<' + tag + ' X="([^\"]+)" Y="([^\"]+)"' + (count === 3 ? ' Z="([^\"]+)"' : ''), 'g');
    return [...block.matchAll(regex)].map(m => m.slice(1).map(Number));
  }

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

    let compiled = null;
    let start = -1;

    for (const f of meshFiles) {
      const d = fs.readFileSync(path.join(directory, f));
      let pos = 0;
      while ((pos = d.indexOf(marker, pos)) >= 0) {
        if (pos >= 40 && pos + vertices.length * 60 <= d.length && d.readUInt32LE(pos + 24) === 0xffffffff) {
          let match = true;
          if (vertices.length > 1) {
            const v1Expected = [...vertices[1], ...normals[1]];
            for (let k = 0; k < 6; k++) {
              const got = d.readFloatLE(pos + 60 + k * 4);
              if (Math.abs(got - v1Expected[k]) > 0.0001) { match = false; break; }
            }
            if (match && vertices.length > 2) {
              const lastIdx = vertices.length - 1;
              const vLastExpected = [...vertices[lastIdx], ...normals[lastIdx]];
              for (let k = 0; k < 6; k++) {
                const got = d.readFloatLE(pos + lastIdx * 60 + k * 4);
                if (Math.abs(got - vLastExpected[k]) > 0.0001) { match = false; break; }
              }
            }
          }
          if (match) {
            compiled = d;
            start = pos;
            break;
          }
        }
        pos += 4;
      }
      if (compiled) break;
    }
    assert(compiled, `Could not locate vertex stream in compiled mesh ${name}`);

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

  assert.equal(entries.length, 16, 'Expected 16 compiled meshes');
  console.log(`[PASS] test_mammoth_compiled: All 4 material maps and all ${total} compiled vertices verified across 16 meshes.`);
}
