'use strict';
// Render the actual W3X-source geometry and four ObjectsGDI maps.
const path = require('path');
const { worldMesh, exportAssets } = require('./generate_columbia_sweeper');
if (!process.argv.includes('--no-export')) exportAssets();
require('./render_dually_preview')(worldMesh, path.resolve(__dirname, '../src/Art/CS'), {
  texturePrefix: 'CSSweeper', namePrefix: 'sweeper-v3',
  outputDirectory: process.argv[2], target: [1,0,Number(process.argv[4] || 10)], scale: Number(process.argv[3] || 15),
});
