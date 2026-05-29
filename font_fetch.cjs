const https = require('https');
const fs = require('fs');

const cssUrl = 'https://fonts.googleapis.com/css2?family=Syne:wght@800';

https.get(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0' } }, (res) => {
  let css = '';
  res.on('data', d => css += d);
  res.on('end', () => {
    const match = css.match(/url\((https:\/\/[^)]+)\)/);
    if (!match) { console.error("No woff2 found", css); return; }
    const woff2Url = match[1];
    console.log("Found font url:", woff2Url);
    https.get(woff2Url, (woff2Res) => {
      let chunks = [];
      woff2Res.on('data', d => chunks.push(d));
      woff2Res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const dataUri = `data:font/woff2;charset=utf-8;base64,${base64}`;
        
        const renderSvg = (bgColor, shadowColor, textColor) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <style>
      @font-face {
        font-family: 'Syne';
        font-style: normal;
        font-weight: 800;
        src: url('${dataUri}') format('woff2');
      }
      .tk-text { font-family: 'Syne', system-ui, sans-serif; font-weight: 800; font-size: 55px; letter-spacing: -2px; }
    </style>
  </defs>
  <rect width="100" height="100" rx="22" fill="${bgColor}"/>
  <text x="54" y="74" class="tk-text" fill="${shadowColor}" text-anchor="middle">tk</text>
  <text x="50" y="70" class="tk-text" fill="${textColor}" text-anchor="middle">tk</text>
</svg>`;

        fs.writeFileSync('./public/icon.svg', renderSvg('#F2F7F4', 'rgba(0,0,0,0.5)', '#1D8A4C'));
        fs.writeFileSync('./public/icon-dark.svg', renderSvg('#0A0A0B', 'rgba(0,0,0,0.5)', '#C8FF00'));
        console.log("SUCCESS WOFF2");
      });
    });
  });
});
