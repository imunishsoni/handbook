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

  // Aura Icon: Elegant glowing geometric "A" prism floating in a deep obsidian-indigo rounded squircle
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <!-- Drop shadows -->
      <filter id="appShadow" x="-20%" y="-20%" width="140%" height="145%">
        <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="#000000" flood-opacity="0.55" />
      </filter>

      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="28" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Gradients -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141824" />
        <stop offset="50%" stop-color="#0e111a" />
        <stop offset="100%" stop-color="#07090e" />
      </linearGradient>

      <!-- Ambient radial aura in background -->
      <radialGradient id="auraGlow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.32" />
        <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.10" />
        <stop offset="100%" stop-color="#0e111a" stop-opacity="0" />
      </radialGradient>

      <!-- Left leg of A (Cyan to Indigo) -->
      <linearGradient id="leftLeg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="45%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#4f46e5" />
      </linearGradient>

      <!-- Right leg of A (Violet to Fuchsia) -->
      <linearGradient id="rightLeg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="60%" stop-color="#ec4899" />
        <stop offset="100%" stop-color="#f43f5e" />
      </linearGradient>

      <!-- Crossbar / Central crystal (Radiant Mint to Sky Blue) -->
      <linearGradient id="crossBar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#2dd4bf" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>

      <!-- Peak facet highlight -->
      <linearGradient id="peakFacet" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
      </linearGradient>
    </defs>

    <!-- Base macOS Squircle Container -->
    <rect x="96" y="96" width="832" height="832" rx="190" ry="190" fill="url(#bgGrad)" filter="url(#appShadow)" stroke="rgba(255,255,255,0.14)" stroke-width="5"/>

    <!-- Subtle inner glass rim -->
    <rect x="100" y="100" width="824" height="824" rx="186" ry="186" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3"/>

    <!-- Soft ambient aura backlight -->
    <rect x="96" y="96" width="832" height="832" rx="190" ry="190" fill="url(#auraGlow)"/>

    <!-- Decorative grid accents (subtle code editor grid motif) -->
    <circle cx="512" cy="512" r="260" fill="none" stroke="rgba(99,102,241,0.12)" stroke-width="2" stroke-dasharray="8 12"/>
    <circle cx="512" cy="512" r="320" fill="none" stroke="rgba(56,189,248,0.08)" stroke-width="1.5" stroke-dasharray="4 8"/>

    <!-- Glowing Geometric "A" Glyph -->
    <g filter="url(#glow)">
      <!-- Left Angled Pillar -->
      <path d="M 512 240 L 420 240 L 250 720 L 370 720 L 460 460 L 512 320 Z" fill="url(#leftLeg)" />

      <!-- Right Angled Pillar -->
      <path d="M 512 240 L 604 240 L 774 720 L 654 720 L 564 460 L 512 320 Z" fill="url(#rightLeg)" />

      <!-- Central Floating Crystal Crossbeam (chevron angle for futuristic prism vibe) -->
      <polygon points="340,560 684,560 644,640 380,640" fill="url(#crossBar)" opacity="0.95" />

      <!-- Inner Apex Prism Diamond Accent -->
      <polygon points="512,240 560,370 512,420 464,370" fill="url(#peakFacet)" />

      <!-- Glowing Core Orb in apex -->
      <circle cx="512" cy="380" r="14" fill="#ffffff" filter="drop-shadow(0 0 16px #38bdf8)" />
    </g>
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
  await new Promise(r => setTimeout(r, 600));

  const image = await win.webContents.capturePage();
  const buildDir = path.join(__dirname, '../build');
  const iconsetDir = path.join(buildDir, 'icon.iconset');

  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir, { recursive: true });

  const raw1024 = path.join(buildDir, 'icon_1024.png');
  fs.writeFileSync(raw1024, image.toPNG());

  console.log('Generating multi-resolution iconset...');
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
  console.log('Generated Aura icon.icns successfully at:', icnsPath);

  app.quit();
});
