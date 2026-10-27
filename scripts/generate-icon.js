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

  // Handbook Icon: Closed dimensional hardcover developer handbook inside macOS squircle
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <!-- Squircle & App Shadow -->
      <filter id="appShadow" x="-25%" y="-25%" width="150%" height="155%">
        <feDropShadow dx="0" dy="32" stdDeviation="38" flood-color="#000000" flood-opacity="0.65" />
      </filter>

      <!-- Book Depth Shadow -->
      <filter id="bookShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.75" />
      </filter>

      <!-- Ribbon Drop Shadow -->
      <filter id="ribbonShadow" x="-40%" y="-20%" width="180%" height="160%">
        <feDropShadow dx="4" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.6" />
      </filter>

      <!-- Emblem Radiant Glow -->
      <filter id="emblemGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Base Canvas Background Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#161822" />
        <stop offset="50%" stop-color="#0e1017" />
        <stop offset="100%" stop-color="#07080b" />
      </linearGradient>

      <!-- Ambient Glow Behind Book -->
      <radialGradient id="ambientGlow" cx="50%" cy="48%" r="48%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25" />
        <stop offset="55%" stop-color="#38bdf8" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#07080b" stop-opacity="0" />
      </radialGradient>

      <!-- Back Cover Gradient -->
      <linearGradient id="backCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#181d2a" />
        <stop offset="100%" stop-color="#0a0d14" />
      </linearGradient>

      <!-- Stacked Pages (Fore-edge Right) -->
      <linearGradient id="pageStackRight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#94a3b8" />
        <stop offset="25%" stop-color="#e2e8f0" />
        <stop offset="70%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#64748b" />
      </linearGradient>

      <!-- Stacked Pages (Bottom) -->
      <linearGradient id="pageStackBottom" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#94a3b8" />
        <stop offset="40%" stop-color="#e2e8f0" />
        <stop offset="85%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#475569" />
      </linearGradient>

      <!-- Front Cover Leather Gradient -->
      <linearGradient id="frontCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#242c40" />
        <stop offset="45%" stop-color="#1a2030" />
        <stop offset="100%" stop-color="#101420" />
      </linearGradient>

      <!-- Spine Curvature Gradient -->
      <linearGradient id="spineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#101420" />
        <stop offset="35%" stop-color="#2e3852" />
        <stop offset="70%" stop-color="#20273a" />
        <stop offset="90%" stop-color="#121622" />
        <stop offset="100%" stop-color="#090c14" />
      </linearGradient>

      <!-- Silk Ribbon Bookmark (Vibrant Emerald / Mint) -->
      <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="40%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>

      <!-- Ribbon Sheen Streak -->
      <linearGradient id="ribbonSheen" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="40%" stop-color="#ffffff" stop-opacity="0.45" />
        <stop offset="70%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>

      <!-- Elastic Closure Band Gradient -->
      <linearGradient id="elasticGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#11141c" />
        <stop offset="30%" stop-color="#222838" />
        <stop offset="70%" stop-color="#1a1e2b" />
        <stop offset="100%" stop-color="#0d1017" />
      </linearGradient>

      <!-- Emblem Plaque Gradient -->
      <linearGradient id="plaqueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#161c28" />
        <stop offset="100%" stop-color="#0c0f16" />
      </linearGradient>

      <!-- Emblem Plaque Bevel Stroke -->
      <linearGradient id="plaqueStroke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.8" />
        <stop offset="50%" stop-color="#a78bfa" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2" />
      </linearGradient>

      <!-- Glowing Code Glyph Gradient (Electric Cyan to Neon Purple) -->
      <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#818cf8" />
        <stop offset="100%" stop-color="#c084fc" />
      </linearGradient>

      <!-- Metallic Corner Bracket Gradient -->
      <linearGradient id="cornerMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#94a3b8" />
        <stop offset="35%" stop-color="#e2e8f0" />
        <stop offset="70%" stop-color="#64748b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>

      <!-- Foil Title Gradient -->
      <linearGradient id="titleFoilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#cbd5e1" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
    </defs>

    <!-- macOS Squircle Container -->
    <rect x="96" y="96" width="832" height="832" rx="190" ry="190" fill="url(#bgGrad)" filter="url(#appShadow)" stroke="rgba(255,255,255,0.12)" stroke-width="5" />
    <rect x="100" y="100" width="824" height="824" rx="186" ry="186" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2.5" />
    <rect x="96" y="96" width="832" height="832" rx="190" ry="190" fill="url(#ambientGlow)" />

    <!-- ============================================================ -->
    <!-- CLOSED HANDBOOK GRAPHIC                                     -->
    <!-- ============================================================ -->
    <g filter="url(#bookShadow)">
      <!-- 1. Back Cover Plate (slight offset for 3D thickness) -->
      <rect x="252" y="184" width="520" height="644" rx="28" fill="url(#backCoverGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>

      <!-- 2. Stacked Fore-edge Paper Block (Right side) -->
      <path d="M 724 204 L 758 214 L 758 812 L 724 804 Z" fill="url(#pageStackRight)"/>
      <!-- Page layer striations -->
      <line x1="727" y1="280" x2="755" y2="288" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>
      <line x1="727" y1="360" x2="755" y2="368" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>
      <line x1="727" y1="440" x2="755" y2="448" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>
      <line x1="727" y1="520" x2="755" y2="528" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>
      <line x1="727" y1="600" x2="755" y2="608" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>
      <line x1="727" y1="680" x2="755" y2="688" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>
      <line x1="727" y1="760" x2="755" y2="768" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>

      <!-- 3. Stacked Bottom Paper Block -->
      <path d="M 314 804 L 758 812 L 752 828 L 314 820 Z" fill="url(#pageStackBottom)"/>
      <line x1="330" y1="812" x2="745" y2="820" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <line x1="340" y1="816" x2="740" y2="824" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>

      <!-- 4. Emerald Silk Ribbon Bookmark (Hanging down from between pages) -->
      <g filter="url(#ribbonShadow)">
        <polygon points="460,796 508,796 508,880 484,856 460,880" fill="url(#ribbonGrad)"/>
        <!-- Lustrous sheen -->
        <polygon points="468,796 484,796 484,856 476,864 468,872" fill="url(#ribbonSheen)"/>
      </g>

      <!-- 5. Front Hardcover -->
      <rect x="256" y="180" width="472" height="630" rx="26" fill="url(#frontCoverGrad)" stroke="rgba(255,255,255,0.15)" stroke-width="2.5"/>

      <!-- Front Cover Blind-Debossed Border Frame -->
      <rect x="340" y="206" width="364" height="578" rx="14" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="3"/>
      <rect x="341" y="207" width="362" height="576" rx="13" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>

      <!-- Inner Fine Filigree Inset Frame -->
      <rect x="352" y="218" width="340" height="554" rx="8" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

      <!-- 6. Spine (Left Edge with Curved 3D Cylinder Lighting) -->
      <path d="M 276 180 C 262 180, 256 188, 256 204 L 256 786 C 256 802, 262 810, 276 810 L 322 810 L 322 180 Z" fill="url(#spineGrad)"/>

      <!-- Spine Hinge Crease Groove -->
      <line x1="322" y1="180" x2="322" y2="810" stroke="rgba(0,0,0,0.65)" stroke-width="4"/>
      <line x1="324" y1="180" x2="324" y2="810" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>

      <!-- Spine Embossed Ribs / Bands -->
      <!-- Rib 1 -->
      <line x1="258" y1="255" x2="320" y2="255" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
      <line x1="258" y1="258" x2="320" y2="258" stroke="rgba(0,0,0,0.6)" stroke-width="3"/>
      <!-- Rib 2 -->
      <line x1="258" y1="380" x2="320" y2="380" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
      <line x1="258" y1="383" x2="320" y2="383" stroke="rgba(0,0,0,0.6)" stroke-width="3"/>
      <!-- Rib 3 -->
      <line x1="258" y1="610" x2="320" y2="610" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
      <line x1="258" y1="613" x2="320" y2="613" stroke="rgba(0,0,0,0.6)" stroke-width="3"/>
      <!-- Rib 4 -->
      <line x1="258" y1="735" x2="320" y2="735" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
      <line x1="258" y1="738" x2="320" y2="738" stroke="rgba(0,0,0,0.6)" stroke-width="3"/>

      <!-- 7. Elastic Closure Strap (Right Side Band) -->
      <g>
        <!-- Strap shadow on cover -->
        <rect x="646" y="178" width="34" height="634" rx="4" fill="#000000" opacity="0.45" filter="url(#bookShadow)"/>
        <!-- Strap body -->
        <rect x="648" y="176" width="30" height="638" rx="4" fill="url(#elasticGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
        <!-- Stitching effect down the strap -->
        <line x1="652" y1="180" x2="652" y2="810" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" stroke-dasharray="4,4"/>
        <line x1="674" y1="180" x2="674" y2="810" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" stroke-dasharray="4,4"/>
      </g>

      <!-- 8. Protective Metallic Corner Clasps -->
      <!-- Top Right Corner -->
      <path d="M 692 180 L 728 180 L 728 216 L 712 216 L 712 196 L 692 196 Z" fill="url(#cornerMetal)" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
      <circle cx="718" cy="190" r="2.5" fill="#1e293b"/>
      <!-- Bottom Right Corner -->
      <path d="M 692 810 L 728 810 L 728 774 L 712 774 L 712 794 L 692 794 Z" fill="url(#cornerMetal)" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
      <circle cx="718" cy="800" r="2.5" fill="#1e293b"/>

      <!-- 9. Centerpiece: Embossed Plaque & Glowing Code Emblem -->
      <g filter="url(#emblemGlow)">
        <!-- Raised Debossed Medallion Plaque -->
        <rect x="424" y="394" width="144" height="144" rx="32" fill="url(#plaqueGrad)" stroke="url(#plaqueStroke)" stroke-width="3"/>
        <rect x="428" y="398" width="136" height="136" rx="28" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>

        <!-- Ambient Center Core Glow -->
        <circle cx="496" cy="466" r="38" fill="#6366f1" opacity="0.25"/>

        <!-- Radiant Code Symbol < / > -->
        <!-- Left Bracket < -->
        <path d="M 466 444 L 444 466 L 466 488" fill="none" stroke="url(#codeGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Forward Slash / -->
        <line x1="505" y1="436" x2="487" y2="496" stroke="url(#codeGrad)" stroke-width="6.5" stroke-linecap="round"/>
        <!-- Right Bracket > -->
        <path d="M 526 444 L 548 466 L 526 488" fill="none" stroke="url(#codeGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- 10. Embossed Foil Title "HANDBOOK" -->
      <text x="496" y="586" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="7" fill="url(#titleFoilGrad)">HANDBOOK</text>
      <!-- Sub-rule foil accents -->
      <line x1="446" y1="610" x2="546" y2="610" stroke="rgba(255,255,255,0.25)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="472" y1="624" x2="520" y2="624" stroke="rgba(255,255,255,0.14)" stroke-width="2" stroke-linecap="round"/>
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
  const rootDir = path.join(__dirname, '..');
  const buildDir = path.join(rootDir, 'build');
  const assetsDir = path.join(rootDir, 'assets');
  const iconsetDir = path.join(buildDir, 'icon.iconset');

  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir, { recursive: true });

  const raw1024 = path.join(buildDir, 'icon_1024.png');
  fs.writeFileSync(raw1024, image.toPNG());

  // Save assets/icon.svg and assets/icon.png (512x512) for web and README display
  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svg.trim());
  const assetPng512 = path.join(assetsDir, 'icon.png');
  execSync(`sips -z 512 512 "${raw1024}" --out "${assetPng512}" > /dev/null 2>&1`);
  console.log('Saved README asset icon at:', assetPng512);

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

  // Generate Windows .ico icon resource containing 16, 32, 64, 128, 256 px slices
  console.log('Generating Windows multi-resolution icon.ico...');
  const icoSizes = [16, 32, 64, 128, 256];
  const pngBuffers = [];
  for (const sz of icoSizes) {
    const p = path.join(iconsetDir, `icon_${sz}x${sz}.png`);
    if (fs.existsSync(p)) pngBuffers.push(fs.readFileSync(p));
  }

  if (pngBuffers.length > 0) {
    const count = pngBuffers.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type 1 = ICO
    header.writeUInt16LE(count, 4); // count

    const dirEntries = [];
    let offset = 6 + count * 16;

    for (const buf of pngBuffers) {
      const entry = Buffer.alloc(16);
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);

      entry.writeUInt8(width >= 256 ? 0 : width, 0);
      entry.writeUInt8(height >= 256 ? 0 : height, 1);
      entry.writeUInt8(0, 2); // palette
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bits per pixel
      entry.writeUInt32LE(buf.length, 8); // image size
      entry.writeUInt32LE(offset, 12); // offset
      dirEntries.push(entry);
      offset += buf.length;
    }

    const icoBuffer = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
    const icoPath = path.join(buildDir, 'icon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('Generated Handbook icon.ico successfully at:', icoPath);
  }

  app.quit();
});
