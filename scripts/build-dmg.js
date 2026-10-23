const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appPath = path.join(distDir, 'Handbook.app');
const stagingDir = path.join(os.tmpdir(), 'handbook-dmg-staging-' + Date.now());

// Universal 2 Distribution Artifacts
const universalDmg = path.join(distDir, 'Handbook-mac-universal.dmg');
const universalZip = path.join(distDir, 'Handbook-mac-universal.zip');
const arm64Dmg = path.join(distDir, 'Handbook-mac-arm64.dmg');
const arm64Zip = path.join(distDir, 'Handbook-mac-arm64.zip');
const x86Dmg = path.join(distDir, 'Handbook-mac-x86_64.dmg');
const x86Zip = path.join(distDir, 'Handbook-mac-x86_64.zip');

console.log('1. Checking native Universal 2 application bundle at:', appPath);
if (!fs.existsSync(appPath)) {
  console.log('Native app not built yet, running native build...');
  execSync('./scripts/build-native.sh', { cwd: rootDir, stdio: 'inherit' });
}

// Verify Mach-O architectures
try {
  const binaryPath = path.join(appPath, 'Contents', 'MacOS', 'Handbook');
  const lipoOutput = execSync(`lipo -info "${binaryPath}"`).toString().trim();
  console.log('   Binary architecture check:', lipoOutput);
} catch (e) {
  console.warn('   Could not verify lipo architectures:', e.message);
}

console.log('2. Preparing DMG staging directory in temp...');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

execSync(`cp -R "${appPath}" "${stagingDir}/"`);
execSync(`ln -s /Applications "${stagingDir}/Applications"`);

// Set closed book volume icon on the mounted DMG disk image
const icnsSource = path.join(rootDir, 'build', 'icon.icns');
if (fs.existsSync(icnsSource)) {
  const destIcon = path.join(stagingDir, '.VolumeIcon.icns');
  fs.copyFileSync(icnsSource, destIcon);
  try {
    execSync(`SetFile -c icnC "${destIcon}"`);
    execSync(`SetFile -a C "${stagingDir}"`);
  } catch (e) {
    console.warn('SetFile skipped for volume icon:', e.message);
  }
}

console.log('3. Creating Universal 2 native DMG image...');
if (fs.existsSync(universalDmg)) fs.unlinkSync(universalDmg);
execSync(`hdiutil create -volname "Handbook" -srcfolder "${stagingDir}" -ov -format UDZO "${universalDmg}"`, {
  stdio: 'inherit',
});

// Clean up staging dir
fs.rmSync(stagingDir, { recursive: true, force: true });

console.log('4. Creating Universal 2 ZIP archive...');
if (fs.existsSync(universalZip)) fs.unlinkSync(universalZip);
execSync(`ditto -c -k --sequesterRsrc --keepParent "${appPath}" "${universalZip}"`);

console.log('5. Creating architecture-specific download targets (arm64 & x86_64)...');
// Provide arm64 and x86_64 copies for users looking for specific architecture names
fs.copyFileSync(universalDmg, arm64Dmg);
fs.copyFileSync(universalZip, arm64Zip);
fs.copyFileSync(universalDmg, x86Dmg);
fs.copyFileSync(universalZip, x86Zip);

console.log('\nBuild completed successfully:');
console.log('  Universal DMG:', universalDmg);
console.log('  Universal ZIP:', universalZip);
console.log('  ARM64 DMG:    ', arm64Dmg);
console.log('  x86_64 DMG:   ', x86Dmg);
