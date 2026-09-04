const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Generate standard multiples of 48px required by Google
const sizes = [48, 96, 144, 192, 512];
const pngs = {};

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render().asPng();
  pngs[size] = pngData;
  const outPath = path.join(__dirname, '..', 'public', `favicon-${size}x${size}.png`);
  fs.writeFileSync(outPath, pngData);
  console.log(`Generated favicon-${size}x${size}.png (${pngData.length} bytes)`);
}

// Also generate apple-touch-icon.png (180x180)
const resvgApple = new Resvg(svg, { fitTo: { mode: 'width', value: 180 } });
const applePng = resvgApple.render().asPng();
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), applePng);
console.log(`Generated apple-touch-icon.png (${applePng.length} bytes)`);

// Build a proper multi-resolution / 48x48 favicon.ico
// An ICO file wrapping PNG data is standard and supported by all modern search engines & browsers.
// Google requires >= 48px square.
const ico48Png = pngs[48];
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // ICO type
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoDir = Buffer.alloc(16);
icoDir.writeUInt8(48, 0); // width: 48
icoDir.writeUInt8(48, 1); // height: 48
icoDir.writeUInt8(0, 2);  // color count (0 = >= 8bpp)
icoDir.writeUInt8(0, 3);  // reserved
icoDir.writeUInt16LE(1, 4); // color planes
icoDir.writeUInt16LE(32, 6); // bpp
icoDir.writeUInt32LE(ico48Png.length, 8); // image data size
icoDir.writeUInt32LE(22, 12); // image offset: 6 + 16 = 22

const icoBuffer = Buffer.concat([icoHeader, icoDir, ico48Png]);
const icoPath = path.join(__dirname, '..', 'public', 'favicon.ico');
fs.writeFileSync(icoPath, icoBuffer);
console.log(`Generated favicon.ico with 48x48 PNG payload (${icoBuffer.length} bytes)`);
