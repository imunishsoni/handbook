#!/usr/bin/env node

/**
 * Handbook — Cross-Platform CLI Launcher
 * Works on macOS, Linux, and Windows.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

function findExecutable() {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';
  const isLinux = process.platform === 'linux';

  // 1. Check native macOS bundle
  if (isMac) {
    const nativeApp = '/Applications/Handbook.app/Contents/MacOS/Handbook';
    if (fs.existsSync(nativeApp)) return { cmd: nativeApp, args };
    const distNative = path.join(rootDir, 'dist', 'Handbook.app', 'Contents', 'MacOS', 'Handbook');
    if (fs.existsSync(distNative)) return { cmd: distNative, args };
  }

  // 2. Check packaged Windows executable
  if (isWin) {
    const candidates = [
      path.join(rootDir, 'dist', 'Handbook-win32-x64', 'Handbook.exe'),
      path.join(rootDir, 'dist', 'Handbook-win32-arm64', 'Handbook.exe'),
      path.join(rootDir, 'dist', 'Handbook.exe'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return { cmd: c, args };
    }
  }

  // 3. Check packaged Linux executable
  if (isLinux) {
    const candidates = [
      path.join(rootDir, 'dist', 'Handbook-linux-x64', 'Handbook'),
      path.join(rootDir, 'dist', 'Handbook-linux-arm64', 'Handbook'),
      '/opt/Handbook/Handbook',
      '/usr/local/bin/Handbook',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return { cmd: c, args };
    }
  }

  // 4. Default: Launch via Electron runtime
  const electronBin = path.join(rootDir, 'node_modules', '.bin', isWin ? 'electron.cmd' : 'electron');
  if (fs.existsSync(electronBin)) {
    return { cmd: electronBin, args: [rootDir, ...args] };
  }

  return { cmd: isWin ? 'electron.cmd' : 'electron', args: [rootDir, ...args] };
}

const target = findExecutable();
const child = spawn(target.cmd, target.args, {
  stdio: 'inherit',
  detached: true,
  env: process.env,
});

child.unref();
process.exit(0);
