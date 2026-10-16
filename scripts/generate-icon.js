const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      offscreen: true,
    },
  });

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <!-- Squircle Clip -->
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.45" />
      </filter>
      
      <!-- Linear Gradients for 3D S Ribbon -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#34373c" />
        <stop offset="100%" stop-color="#1e2023" />
      </linearGradient>

      <linearGradient id="topStripe" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFAB40" />
        <stop offset="100%" stop-color="#FF5722" />
      </linearGradient>

      <linearGradient id="midStripe" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF8A65" />
        <stop offset="100%" stop-color="#D84315" />
      </linearGradient>

      <linearGradient id="botStripe" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF7043" />
        <stop offset="100%" stop-color="#BF360C" />
      </linearGradient>
    </defs>

    <!-- App Icon Base Squircle (macOS standard curvature) -->
    <rect x="96" y="96" width="832" height="832" rx="185" ry="185" fill="url(#bgGrad)" filter="url(#shadow)" stroke="rgba(255,255,255,0.12)" stroke-width="6"/>

    <!-- Subtle inner highlight border -->
    <rect x="99" y="99" width="826" height="826" rx="182" ry="182" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4"/>

    <!-- Sublime "S" Layered Ribbons -->
    <!-- Top folded segment -->
    <path d="M 280 270 L 680 340 L 750 450 L 350 380 Z" fill="url(#topStripe)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.35))" />

    <!-- Center connecting folded segment -->
    <path d="M 330 430 L 730 500 L 670 620 L 270 550 Z" fill="url(#midStripe)" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.4))" />

    <!-- Bottom folded segment -->
    <path d="M 290 600 L 690 670 L 740 760 L 340 690 Z" fill="url(#botStripe)" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.45))" />
  </svg>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
          svg { width: 1024px; height: 1024px; }
        </style>
      </head>
      <body>
        ${svg}
      </body>
    </html>
  `;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Wait for render
  await new Promise(r => setTimeout(r, 500));

  const image = await win.webContents.capturePage();
  const iconsetDir = path.join(__dirname, '../build/icon.iconset');
  const buildDir = path.join(__dirname, '../build');

  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir, { recursive: true });

  const raw1024 = path.join(buildDir, 'icon_1024.png');
  fs.writeFileSync(raw1024, image.toPNG());

  console.log('Saved 1024x1024 PNG, generating iconset...');

  const sizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  for (const s of sizes) {
    const dest = path.join(iconsetDir, s.name);
    execSync(`sips -z ${s.size} ${s.size} "${raw1024}" --out "${dest}" > /dev/null 2>&1`);
  }

  const icnsPath = path.join(buildDir, 'icon.icns');
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
  console.log('Generated icon.icns successfully at', icnsPath);

  app.quit();
});
