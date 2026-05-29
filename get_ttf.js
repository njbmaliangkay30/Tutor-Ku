import https from 'https';

const cssUrl = 'https://fonts.googleapis.com/css2?family=Syne:wght@800';
https.get(cssUrl, { headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)' } }, (res) => {
  let css = '';
  res.on('data', d => css += d);
  res.on('end', () => {
    const match = css.match(/url\((https:\/\/[^)]+)\)/);
    console.log(match[1]);
  });
});
