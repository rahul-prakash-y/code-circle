const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');
const distDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(srcDir)) {
  console.error('[copyJsToDist] src directory does not exist:', srcDir);
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

let copiedCount = 0;

function copyDir(currentSrc, currentDist) {
  const entries = fs.readdirSync(currentSrc, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(currentSrc, entry.name);
    const distPath = path.join(currentDist, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }
      copyDir(srcPath, distPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();

      // Skip TypeScript files
      if (ext === '.ts' || ext === '.tsx' || ext === '.d.ts') {
        continue;
      }

      // If it's a JavaScript file, only copy if there is NO corresponding .ts file in the same source folder
      if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
        const baseName = path.basename(entry.name, ext);
        const correspondingTs = path.join(currentSrc, `${baseName}.ts`);
        const correspondingTsx = path.join(currentSrc, `${baseName}.tsx`);

        if (fs.existsSync(correspondingTs) || fs.existsSync(correspondingTsx)) {
          // A TypeScript source exists and was compiled by tsc; do not overwrite dist with legacy js
          continue;
        }
      }

      // Copy the file
      const parentDist = path.dirname(distPath);
      if (!fs.existsSync(parentDist)) {
        fs.mkdirSync(parentDist, { recursive: true });
      }

      fs.copyFileSync(srcPath, distPath);
      copiedCount++;
      console.log(`[copyJsToDist] Copied: ${path.relative(srcDir, srcPath)} -> ${path.relative(distDir, distPath)}`);
    }
  }
}

console.log('[copyJsToDist] Copying runtime non-TS files from src to dist...');
copyDir(srcDir, distDir);
console.log(`[copyJsToDist] Done. Copied ${copiedCount} file(s) to dist.`);
