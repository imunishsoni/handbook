const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appPath = path.join(distDir, 'Aura-darwin-arm64', 'Aura.app');
const stagingDir = path.join(os.tmpdir(), 'aura-dmg-staging-' + Date.now());
const dmgOutput = path.join(distDir, 'Aura-arm64.dmg');
const zipOutput = path.join(distDir, 'Aura-arm64.zip');

console.log('1. Checking application bundle at:', appPath);
if (!fs.existsSync(appPath)) {
  console.log('App not packaged yet, running pack step...');
  execSync('npm run pack', { cwd: rootDir, stdio: 'inherit' });
}

console.log('2. Preparing DMG staging directory in temp...');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

execSync(`cp -R "${appPath}" "${stagingDir}/"`);
execSync(`ln -s /Applications "${stagingDir}/Applications"`);

console.log('3. Creating compressed DMG image...');
if (fs.existsSync(dmgOutput)) {
  fs.unlinkSync(dmgOutput);
}
execSync(`hdiutil create -volname "Aura" -srcfolder "${stagingDir}" -ov -format UDZO "${dmgOutput}"`, {
  stdio: 'inherit',
});

// Clean up staging dir
fs.rmSync(stagingDir, { recursive: true, force: true });

console.log('4. Creating ZIP archive...');
if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}
execSync(`ditto -c -k --sequesterRsrc --keepParent "${appPath}" "${zipOutput}"`);

console.log('Build completed successfully:');
console.log('  DMG:', dmgOutput);
console.log('  ZIP:', zipOutput);
