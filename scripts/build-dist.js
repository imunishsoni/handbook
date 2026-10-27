#!/usr/bin/env node

/**
 * Handbook — Cross-Platform Distribution Builder
 * Creates release packages for macOS, Linux, and Windows.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const args = process.argv.slice(2);

const buildAll = args.includes('--all');
const buildMac = buildAll || args.includes('--mac') || (!args.length && process.platform === 'darwin');
const buildLinux = buildAll || args.includes('--linux') || (!args.length && process.platform === 'linux');
const buildWin = buildAll || args.includes('--win') || (!args.length && process.platform === 'win32');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       Handbook — Cross-Platform Distribution Pipeline      ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`Targets: macOS=${buildMac}, Linux=${buildLinux}, Windows=${buildWin}`);

// Ensure icons exist
console.log('\n==> Verifying cross-platform application icons...');
const icns = path.join(rootDir, 'build', 'icon.icns');
const ico = path.join(rootDir, 'build', 'icon.ico');
const png = path.join(rootDir, 'assets', 'icon.png');
if (!fs.existsSync(icns) || !fs.existsSync(ico) || !fs.existsSync(png)) {
  console.log('Generating missing icons...');
  execSync('npm run icon', { cwd: rootDir, stdio: 'inherit' });
}

// -------------------------------------------------------------
// 1. macOS Build (Bare-metal Universal 2 + DMGs + ZIPs)
// -------------------------------------------------------------
if (buildMac) {
  console.log('\n========================================');
  console.log(' [1/3] Packaging macOS Distribution');
  console.log('========================================');
  try {
    if (process.platform === 'darwin') {
      execSync('./scripts/build-native.sh', { cwd: rootDir, stdio: 'inherit' });
      execSync('node scripts/build-dmg.js', { cwd: rootDir, stdio: 'inherit' });
    } else {
      console.log('Cross-packaging macOS via Electron Packager...');
      execSync(
        `npx electron-packager . "Handbook" --platform=darwin --arch=x64,arm64 --icon=build/icon.icns --out=dist --overwrite --prune=true --ignore=^/dist --ignore=^/build/icon.iconset`,
        { cwd: rootDir, stdio: 'inherit' }
      );
    }
  } catch (err) {
    console.error('macOS build failed:', err.message);
  }
}

// -------------------------------------------------------------
// 2. Linux Build (App bundle + .desktop + .tar.gz + .zip)
// -------------------------------------------------------------
if (buildLinux) {
  console.log('\n========================================');
  console.log(' [2/3] Packaging Linux Distribution');
  console.log('========================================');
  try {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    console.log(`Packaging Linux ${arch}...`);
    execSync(
      `npx electron-packager . "Handbook" --platform=linux --arch=${arch} --icon=assets/icon.png --out=dist --overwrite --prune=true --ignore=^/dist --ignore=^/build/icon.iconset`,
      { cwd: rootDir, stdio: 'inherit' }
    );

    const linuxDir = path.join(distDir, `Handbook-linux-${arch}`);
    if (fs.existsSync(linuxDir)) {
      // Add desktop entry
      const desktopEntry = `[Desktop Entry]
Name=Handbook
Comment=Pure speed. Zero friction. A high-performance text and code editor.
Exec=Handbook %F
Icon=icon
Terminal=false
Type=Application
Categories=Development;TextEditor;Utility;
MimeType=text/plain;text/x-chdr;text/x-csrc;text/x-c++hdr;text/x-c++src;text/x-java;text/x-dsrc;text/x-pascal;text/x-perl;text/x-python;application/x-php;text/html;text/css;text/x-sql;text/x-diff;
`;
      fs.writeFileSync(path.join(linuxDir, 'handbook.desktop'), desktopEntry);
      fs.copyFileSync(path.join(rootDir, 'assets', 'icon.png'), path.join(linuxDir, 'icon.png'));
      fs.copyFileSync(path.join(rootDir, 'bin', 'handbook'), path.join(linuxDir, 'handbook-cli'));

      // Create tar.gz archive
      const tarGz = path.join(distDir, `Handbook-linux-${arch}.tar.gz`);
      if (fs.existsSync(tarGz)) fs.unlinkSync(tarGz);
      execSync(`tar -czf "${tarGz}" -C "${distDir}" "Handbook-linux-${arch}"`);
      console.log('Created Linux tarball:', tarGz);

      // Create zip archive
      const zip = path.join(distDir, `Handbook-linux-${arch}.zip`);
      if (fs.existsSync(zip)) fs.unlinkSync(zip);
      if (process.platform === 'darwin') {
        execSync(`ditto -c -k --keepParent "${linuxDir}" "${zip}"`);
      } else {
        execSync(`zip -r -q "${zip}" "Handbook-linux-${arch}"`, { cwd: distDir });
      }
      console.log('Created Linux zip:', zip);
    }
  } catch (err) {
    console.error('Linux build failed:', err.message);
  }
}

// -------------------------------------------------------------
// 3. Windows Build (Portable .zip + .exe)
// -------------------------------------------------------------
if (buildWin) {
  console.log('\n========================================');
  console.log(' [3/3] Packaging Windows Distribution');
  console.log('========================================');
  try {
    const arch = 'x64';
    console.log(`Packaging Windows ${arch}...`);
    execSync(
      `npx electron-packager . "Handbook" --platform=win32 --arch=${arch} --icon=build/icon.ico --out=dist --overwrite --prune=true --ignore=^/dist --ignore=^/build/icon.iconset`,
      { cwd: rootDir, stdio: 'inherit' }
    );

    const winDir = path.join(distDir, `Handbook-win32-${arch}`);
    if (fs.existsSync(winDir)) {
      // Add launcher helper
      fs.copyFileSync(path.join(rootDir, 'bin', 'handbook.cmd'), path.join(winDir, 'handbook.cmd'));

      // Create portable zip
      const zip = path.join(distDir, `Handbook-windows-${arch}.zip`);
      if (fs.existsSync(zip)) fs.unlinkSync(zip);
      if (process.platform === 'darwin') {
        execSync(`ditto -c -k --keepParent "${winDir}" "${zip}"`);
      } else if (process.platform === 'win32') {
        execSync(`powershell Compress-Archive -Path "${winDir}\\*" -DestinationPath "${zip}" -Force`);
      } else {
        execSync(`zip -r -q "${zip}" "Handbook-win32-${arch}"`, { cwd: distDir });
      }
      console.log('Created Windows portable zip:', zip);
    }
  } catch (err) {
    console.error('Windows build failed:', err.message);
  }
}

console.log('\n==> Distribution build finished! Current distribution files in dist/:');
const distFiles = fs.readdirSync(distDir);
for (const f of distFiles) {
  if (f.endsWith('.dmg') || f.endsWith('.zip') || f.endsWith('.tar.gz') || f.endsWith('.app')) {
    const p = path.join(distDir, f);
    const stats = fs.statSync(p);
    const sz = stats.isDirectory() ? 'DIR' : `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
    console.log(`  - ${f.padEnd(35)} (${sz})`);
  }
}
