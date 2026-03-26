/**
 * Image optimization script — converts public PNGs to WebP for web delivery.
 * Run from project root: node client/scripts/optimize-images.js
 * Output goes to client/public/images/ — referenced in code as /images/<name>.webp
 */
const sharp = require('../node_modules/sharp') || require('sharp');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'images');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Each entry: [filename, maxWidth, quality]
// Sizes chosen for actual render dimensions × 2 for retina
const IMAGES = [
  ['logo.png',                         320,  90],
  ['Homepage_Hero_Illustration.png',   900,  82],
  ['Browse_and_Discover.png',          480,  82],
  ['Purchase_Securely.png',            480,  82],
  ['Download_and_Use.png',             480,  82],
  ['About_Page_Hero_Illustration.png', 900,  82],
  ['Contact_Page_Illustration.png',    800,  82],
  ['Free_Data_Section_Illustration.png', 900, 82],
  ['404_Page_Illustration.png',        700,  82],
  ['No_Results_Found.png',             560,  82],
  ['No_Purchases_Yet.png',             560,  82],
  ['Dataset_Placeholder.png',          800,  82],
];

(async () => {
  for (const [filename, maxWidth, quality] of IMAGES) {
    const input = path.join(PUBLIC_DIR, filename);
    const outName = filename.replace('.png', '.webp');
    const output = path.join(OUT_DIR, outName);

    if (!fs.existsSync(input)) {
      console.warn(`  SKIP (not found): ${filename}`);
      continue;
    }

    const before = fs.statSync(input).size;
    await sharp(input)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toFile(output);
    const after = fs.statSync(output).size;
    const saved = (((before - after) / before) * 100).toFixed(0);
    console.log(`  ${filename.padEnd(45)} ${(before/1024).toFixed(0).padStart(6)}KB → ${(after/1024).toFixed(0).padStart(5)}KB  (-${saved}%)`);
  }
  console.log('\nDone. Output in client/public/images/');
})();
