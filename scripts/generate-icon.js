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

  // Handbook Icon: Stylized dimensional open handbook with glowing code facets inside an obsidian squircle
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <!-- Drop shadow -->
      <filter id="appShadow" x="-20%" y="-20%" width="140%" height="145%">
        <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="#000000" flood-opacity="0.55" />
      </filter>

      <filter id="bookGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="24" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Gradients -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141824" />
        <stop offset="50%" stop-color="#0d111a" />
        <stop offset="100%" stop-color="#07090e" />
      </linearGradient>

      <!-- Ambient glow -->
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.30" />
        <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.10" />
        <stop offset="100%" stop-color="#07090e" stop-opacity="0" />
      </radialGradient>

      <!-- Left Page (Cyan to Cobalt) -->
      <linearGradient id="leftPage" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="60%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#4338ca" />
      </linearGradient>

      <!-- Right Page (Violet to Fuchsia) -->
      <linearGradient id="rightPage" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="60%" stop-color="#c084fc" />
        <stop offset="100%" stop-color="#ec4899" />
      </linearGradient>

      <!-- Book Cover Base Layer (Deep Indigo Slate) -->
      <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e2438" />
        <stop offset="100%" stop-color="#0f1422" />
      </linearGradient>

      <!-- Ribbon Bookmark (Emerald / Mint) -->
      <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2dd4bf" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
    </defs>

    <!-- macOS Big Sur Squircle Base -->
    <rect x="96" y="96" width="832" height="832" rx="190" ry="190" fill="url(#bgGrad)" filter="url(#appShadow)" stroke="rgba(255,255,255,0.14)" stroke-width="5"/>

    <!-- Subtle inner glass highlight -->
    <rect x="100" y="100" width="824" height="824" rx="186" ry="186" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3"/>

    <!-- Ambient backlight -->
    <rect x="96" y="96" width="832" height="832" rx="190" ry="190" fill="url(#centerGlow)"/>

    <!-- Handbook Geometric Glyph -->
    <g filter="url(#bookGlow)">
      <!-- Book Back Cover / Shadow Plate -->
      <path d="M 230 330 C 350 310, 480 340, 512 365 C 544 340, 674 310, 794 330 L 794 725 C 674 705, 544 735, 512 760 C 480 735, 350 705, 230 725 Z" fill="url(#bookCover)" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>

      <!-- Left Page -->
      <path d="M 250 320 C 360 300, 480 330, 510 355 L 510 740 C 480 715, 360 685, 250 705 Z" fill="url(#leftPage)"/>

      <!-- Right Page -->
      <path d="M 514 355 C 544 330, 664 300, 774 320 L 774 705 C 664 685, 544 715, 514 740 Z" fill="url(#rightPage)"/>

      <!-- Page Crease & Spine Shadow -->
      <line x1="512" y1="350" x2="512" y2="755" stroke="rgba(0,0,0,0.45)" stroke-width="6"/>

      <!-- Stylized Code Lines on Left Page -->
      <line x1="290" y1="410" x2="420" y2="410" stroke="#ffffff" stroke-opacity="0.8" stroke-width="10" stroke-linecap="round"/>
      <line x1="290" y1="460" x2="470" y2="460" stroke="#ffffff" stroke-opacity="0.6" stroke-width="8" stroke-linecap="round"/>
      <line x1="330" y1="510" x2="450" y2="510" stroke="#ffffff" stroke-opacity="0.6" stroke-width="8" stroke-linecap="round"/>
      <line x1="330" y1="560" x2="410" y2="560" stroke="#ffffff" stroke-opacity="0.6" stroke-width="8" stroke-linecap="round"/>
      <line x1="290" y1="610" x2="460" y2="610" stroke="#ffffff" stroke-opacity="0.75" stroke-width="8" stroke-linecap="round"/>

      <!-- Stylized Code Lines on Right Page -->
      <line x1="550" y1="410" x2="710" y2="410" stroke="#ffffff" stroke-opacity="0.8" stroke-width="10" stroke-linecap="round"/>
      <line x1="550" y1="460" x2="680" y2="460" stroke="#ffffff" stroke-opacity="0.6" stroke-width="8" stroke-linecap="round"/>
      <line x1="590" y1="510" x2="730" y2="510" stroke="#ffffff" stroke-opacity="0.6" stroke-width="8" stroke-linecap="round"/>
      <line x1="590" y1="560" x2="670" y2="560" stroke="#ffffff" stroke-opacity="0.6" stroke-width="8" stroke-linecap="round"/>
      <line x1="550" y1="610" x2="720" y2="610" stroke="#ffffff" stroke-opacity="0.75" stroke-width="8" stroke-linecap="round"/>

      <!-- Spine Bookmark Ribbon Dropping down -->
      <polygon points="494,340 530,340 530,785 512,765 494,785" fill="url(#ribbonGrad)" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))" />
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

  console.log('Generating Handbook multi-resolution iconset...');
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
  console.log('Generated Handbook icon.icns successfully at:', icnsPath);

  app.quit();
});
