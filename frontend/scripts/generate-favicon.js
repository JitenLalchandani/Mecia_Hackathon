const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

const iconsDir = path.resolve(__dirname, '..', 'public', 'icons');
const out = path.resolve(__dirname, '..', 'public', 'favicon.ico');
const candidates = ['icon-16.png', 'icon-32.png', 'icon-48.png'].map(f => path.join(iconsDir, f));

(async () => {
  try {
    const existing = candidates.filter(p => fs.existsSync(p));
    if (existing.length === 0) {
      console.error('No PNG sources found in', iconsDir);
      process.exit(1);
    }
    const buf = await pngToIco(existing);
    fs.writeFileSync(out, buf);
    console.log('favicon.ico generated at', out);
  } catch (err) {
    console.error('Failed to generate favicon.ico', err);
    process.exit(1);
  }
})();
