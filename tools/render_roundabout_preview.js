'use strict';
// Actual exported model and maps; lighting approximates the game shader.
const path = require('path');
const { worldMesh, exportAssets } = require('./generate_columbia_roundabout');
exportAssets();
require('./render_dually_preview')(worldMesh, path.resolve(__dirname, '../src/Art/CR'), {
  texturePrefix: 'CRRoundabout', namePrefix: 'roundabout-v2',
  outputDirectory: process.argv[2], target: [0,0,10], scale: Number(process.argv[3] || 16),
});
