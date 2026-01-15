const moduleAlias = require('module-alias');
const path = require('path');

moduleAlias.addAliases({
  '@mgmt-api': path.join(__dirname, '')
});

export {};
