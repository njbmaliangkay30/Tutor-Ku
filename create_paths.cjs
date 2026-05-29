const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const fontUrl = "https://unpkg.com/@fontsource/syne@5.1.0/files/syne-latin-800-normal.woff";

https.get(fontUrl, (res) => {
  const file = fs.createWriteStream("syne.woff");
  res.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      execSync('npm i text-to-svg', { stdio: 'ignore' });
      const TextToSVG = require('text-to-svg');
      try {
          const textToSVG = TextToSVG.loadSync('./syne.woff');

          const fontSize = 54;
          
          const renderSvg = (bgColor, shadowColor, textColor) => {
            // align t and k
            const pathT_Bg = textToSVG.getPath('t', {x: 23, y: 72, fontSize: fontSize, attributes: {fill: shadowColor}});
            const pathK_Bg = textToSVG.getPath('k', {x: 43, y: 72, fontSize: fontSize, attributes: {fill: shadowColor}});

            const pathT_Fg = textToSVG.getPath('t', {x: 20, y: 68, fontSize: fontSize, attributes: {fill: textColor}});
            const pathK_Fg = textToSVG.getPath('k', {x: 40, y: 68, fontSize: fontSize, attributes: {fill: textColor}});

            // center them all
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="${bgColor}"/>
  <g transform="translate(15, 3)">
    ${pathT_Bg}
    ${pathK_Bg}
    ${pathT_Fg}
    ${pathK_Fg}
  </g>
</svg>`;
          }

          fs.writeFileSync('./public/icon.svg', renderSvg('#F2F7F4', 'rgba(0,0,0,0.5)', '#1D8A4C'));
          fs.writeFileSync('./public/icon-dark.svg', renderSvg('#0A0A0B', 'rgba(0,0,0,0.5)', '#C8FF00'));
          console.log('SUCCESS paths');
      } catch (err) {
          console.error(err);
      }
    });
  });
});
