'use strict';
const path = require('path');
const { worldMesh, exportAssets } = require('./generate_pasadena_mudtank');
exportAssets();
require('./render_dually_preview')(worldMesh, path.resolve(__dirname, '../src/Art/PM'), {
  texturePrefix: 'PVMudTank',
  namePrefix: 'mudtank-v2',
  outputDirectory: process.argv[2],
  target: [0,0,12],
  scale: 16,
});
