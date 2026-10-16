const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appPath = path.join(distDir, 'Sublime Text-darwin-arm64', 'Sublime Text.app');
const stagingDir = path.join(rootDir, 'build', 'dmg-staging');
const dmgOutput = path.join(distDir, 'Sublime-Text-4-arm64.dmg');

console.log('1. Checking application bundle at:', appPath);
if (!fs.existsSync(appPath)) {
  console.log('App not packaged yet, running pack step...');
  execSync('npm run pack', { cwd: rootDir, stdio: 'inherit' });
}

console.log('2. Preparing DMG staging directory...');
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
execSync(`hdiutil create -volname "Sublime Text" -srcfolder "${stagingDir}" -ov -format UDZO "${dmgOutput}"`, {
  stdio: 'inherit',
});

console.log('DMG created successfully at:', dmgOutput);
