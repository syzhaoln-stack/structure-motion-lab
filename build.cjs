const fs=require('node:fs');
const path=require('node:path');
require('./src/build.cjs');
fs.mkdirSync(path.join(__dirname,'docs'),{recursive:true});
fs.copyFileSync(path.join(__dirname,'src/dist/index.html'),path.join(__dirname,'docs/index.html'));
fs.writeFileSync(path.join(__dirname,'docs/.nojekyll'),'');
console.log('GitHub Pages output: docs/index.html');
