'use strict';
// Version-specific acceptance test for the footprint-only pass against the
// user-tested 3.4 package. This is deliberately not a general future-art test.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {BigReader}=require('./read_cnc_big');
const root=path.resolve(__dirname,'..');
const baseline=path.join(root,'build/baselines/art-pass-3-render-fixed/MDShowdown.big');
const candidate=path.resolve(process.argv[2]||path.join(root,'build/art-v3/MDShowdown.big'));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(baseline)).digest('hex'),
  'f59ae02fa28b2c2dc059988b7277c8d0a27be9a46d4782696bdbccd3fb60691f',
  'Not the known 3.4 baseline; do not reuse these binary offsets for another version');
function assets(file) {
  const big=new BigReader(file);
  try {
    const manifest=big.get('data\\mod.manifest'),binary=big.get('data\\mod.bin');
    assert.equal(manifest.readUInt16LE(2),5);
    const count=manifest.readUInt32LE(12);
    const namesStart=48+count*44+manifest.readUInt32LE(32)+manifest.readUInt32LE(36);
    assert.equal(namesStart+manifest.readUInt32LE(40)+manifest.readUInt32LE(44),manifest.length);
    assert.equal(binary.length,manifest.readUInt32LE(16)+4);
    assert.equal(big.get('data\\mod_l.bin').length,4,'Unexpected separate LowLOD instances; review those too');
    const result=new Map();let position=4;
    for(let i=0;i<count;i++) {
      const start=48+i*44,offset=namesStart+manifest.readUInt32LE(start+24),end=manifest.indexOf(0,offset);
      assert(end>=offset&&end<namesStart+manifest.readUInt32LE(40));
      const name=manifest.toString('utf8',offset,end),size=manifest.readUInt32LE(start+32);
      assert(!result.has(name));assert(position+size<=binary.length);
      result.set(name,binary.subarray(position,position+size));position+=size;
    }
    assert.equal(position,binary.length);return result;
  } finally {big.close();}
}
const before=assets(baseline),after=assets(candidate);
assert.deepEqual([...after.keys()],[...before.keys()],'Unexpected asset set/order change');
const oldObject=before.get('GameObject:GDIPitbull'),newObject=after.get('GameObject:GDIPitbull');
assert(oldObject&&newObject);assert.equal(oldObject.length,newObject.length);
// Offsets established by the source-controlled, geometry-only differential
// build. Pinned baseline hash and whole-object comparison guard the layout.
const patched=Buffer.from(oldObject);
assert.equal(oldObject.readUInt32LE(7064),1);patched.writeUInt32LE(0,7064); // IsSmall
for(const [offset,oldValue,newValue] of [[7084,14,35],[7088,7,16],[7100,11.5,33]]) {
  assert.equal(oldObject.readFloatLE(offset),oldValue);
  patched.writeFloatLE(newValue,offset);
}
assert(patched.equals(newObject),'Compiled object differs beyond the four approved geometry fields');
let unchanged=0;
for(const [name,data] of after)if(name!=='GameObject:GDIPitbull') {
  assert(data.equals(before.get(name)),`Unintended packaged asset change: ${name}`);unchanged++;
}
console.log(`[PASS] Packaged GDIPitbull has only the four approved footprint-field changes; ${unchanged} other compiled assets are byte-identical.`);
console.log('SHA256 '+crypto.createHash('sha256').update(fs.readFileSync(candidate)).digest('hex').toUpperCase());
