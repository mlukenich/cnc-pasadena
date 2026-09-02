'use strict';
// Render the actual W3X-source geometry and four ObjectsGDI maps for Columbia Stealth Cruiser.
const path = require('path');
const { worldMesh, exportAssets } = require('./generate_columbia_stealth');
if (!process.argv.includes('--no-export')) exportAssets();
require('./render_dually_preview')(worldMesh, path.resolve(__dirname, '../src/Art/CT'), {
  texturePrefix: 'CTStealth',
  namePrefix: process.argv[5] || 'stealth-v1',
  outputDirectory: process.argv[2] || path.resolve(__dirname, '../docs/unit-art/stealth-v1'),
  target: [0, 0, Number(process.argv[4] || 8)],
  scale: Number(process.argv[3] || 18),
});
