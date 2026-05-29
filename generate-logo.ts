import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const fontUrl = 'https://fonts.gstatic.com/s/syne/v22/8vIX7w4Mhni_z8syw-8b1g.ttf';

https.get(fontUrl, (res) => {
  const file = fs.createWriteStream("Syne-ExtraBold.ttf");
  res.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      execSync('npm i text-to-svg');
      const TextToSVG = require('text-to-svg');
      const textToSVG = TextToSVG.loadSync('Syne-ExtraBold.ttf');
      
      const metrics = textToSVG.getMetrics('tk', {x: 0, y: 0, fontSize: 52, attributes: {}});
      // to center it in a 100x100 box: 
      // width is metrics.width, height is metrics.height (ascender - descender)
      const x = (100 - metrics.width) / 2;
      const baselineY = 50 + ((metrics.height) / 2) - metrics.descender - 3; 

      const pathForeground = textToSVG.getPath('tk', {x: x + 2, y: baselineY - 2, fontSize: 52}); 
      
      console.log(pathForeground);
    });
  });
});
