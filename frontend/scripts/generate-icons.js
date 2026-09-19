const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcSvg = path.resolve(__dirname, '..', 'public', 'icons', 'icon-512.svg');
const outDir = path.resolve(__dirname, '..', 'public', 'icons');
const sizes = [16, 32, 48, 120, 152, 167, 180, 192, 256, 384, 512];

if (!fs.existsSync(srcSvg)) {
  console.error('Source SVG not found:', srcSvg);
  process.exit(1);
}

(async function generate() {
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    for (const s of sizes) {
      const out = path.join(outDir, `icon-${s}.png`);
      await sharp(srcSvg).resize(s, s).png().toFile(out);
      console.log('Generated', out);
    }
    console.log('All icons generated. Update manifest.json if needed.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
