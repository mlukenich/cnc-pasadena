'use strict';

// Render the same generated geometry/materials that are compiled for the game.
// Lighting approximates ObjectsGDI; this is not a live gameplay screenshot.
const path = require('path');
const mesh = require('./generate_columbia_prius');
require('./render_dually_preview')(mesh, path.resolve(__dirname, '../src/Art/CV'), {
  texturePrefix: 'CVPrius',
  namePrefix: 'prius-v2',
});
