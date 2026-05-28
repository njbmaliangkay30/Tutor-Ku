const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/onClick=\{\(\) \=\> setActiveTab/g, 'onClick={() => handleNav');
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx Updated!');
