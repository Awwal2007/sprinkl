const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const sizes = [48, 96, 144, 192, 512];

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render().asPng();
  const outPath = path.join(__dirname, '..', 'public', `favicon-${size}x${size}.png`);
  fs.writeFileSync(outPath, pngData);
  console.log('Generated:', outPath, '(' + pngData.length + ' bytes)');
}

// Also update 48x48 as favicon.ico or high-res icon if needed
// Specifically, Googlebot looks for /favicon.ico at root.
// A PNG formatted as favicon.ico is standard for modern browsers and search engines,
// or we can generate the 48x48 PNG.
console.log('Favicon generation complete.');
