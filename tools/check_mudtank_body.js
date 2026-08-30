const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'ModSDK', 'BuiltMods', 'mods', 'marylandshowdown', 'data', 'mod', 'assets');
const files = fs.readdirSync(dir).filter(f => f.startsWith('c2b1a262.'));

const xml = fs.readFileSync(path.join(root, 'src', 'Art', 'PM', 'PVMudTank_Model.w3x'), 'utf8');
const entries = [...xml.matchAll(/<W3DMesh id="PVMUDTANK_SKIN\.([^"]+)"[\s\S]*?<\/W3DMesh>/g)];

entries.forEach(entry => {
  const name = entry[1];
  const text = entry[0];
  const block = text.substring(text.indexOf('<Vertices>') + 10, text.indexOf('</Vertices>'));
  const firstLine = block.trim().split('\n')[0];
  const m = firstLine.match(/X="([^"]+)" Y="([^"]+)" Z="([^"]+)"/);
  const v = [Number(m[1]), Number(m[2]), Number(m[3])];
  const marker = Buffer.alloc(12);
  v.forEach((c, i) => marker.writeFloatLE(c, i * 4));

  let found = null;
  files.forEach(f => {
    const d = fs.readFileSync(path.join(dir, f));
    const idx = d.indexOf(marker);
    if (idx >= 0) {
      found = `${f} at idx=${idx} color=0x${d.readUInt32LE(idx + 24).toString(16)}`;
    }
  });
  console.log(name, '->', found);
});
