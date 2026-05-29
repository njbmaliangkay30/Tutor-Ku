const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// Download the real TTF file
const fontUrl = "https://raw.githubusercontent.com/googlefonts/syne/main/fonts/ttf/Syne-ExtraBold.ttf";

https.get(fontUrl, (res) => {
  const file = fs.createWriteStream("syne.ttf");
  res.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      // Load OpenType and TextToSVG
      execSync('npm i text-to-svg', { stdio: 'ignore' });
      const TextToSVG = require('text-to-svg');
      const textToSVG = TextToSVG.loadSync('./syne.ttf');

      // Generate the exact paths for the specific Syne ExtraBold font
      const pathT_Bg = textToSVG.getPath('t', {x: 23, y: 70, fontSize: 58, attributes: {fill: "rgba(0,0,0,0.5)"}});
      const pathT_Fg = textToSVG.getPath('t', {x: 20, y: 67, fontSize: 58, attributes: {fill: "#1D8A4C"}});
      
      const pathK_Bg = textToSVG.getPath('k', {x: 43, y: 70, fontSize: 58, attributes: {fill: "rgba(0,0,0,0.5)"}});
      const pathK_Fg = textToSVG.getPath('k', {x: 40, y: 67, fontSize: 58, attributes: {fill: "#1D8A4C"}});

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#F2F7F4"/>
  ${pathT_Bg}
  ${pathK_Bg}
  ${pathT_Fg}
  ${pathK_Fg}
</svg>`;

      fs.writeFileSync('./public/icon.svg', svgContent);
      console.log('SUCCESS');
      console.log(pathT_Bg); // just log something small
    });
  });
});
