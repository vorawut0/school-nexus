import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// High-Definition App Logo SVG (512x512)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090e1a" />
      <stop offset="35%" stop-color="#0f1b38" />
      <stop offset="70%" stop-color="#143275" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <linearGradient id="accentCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67e8f9" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <linearGradient id="accentGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <linearGradient id="metalSilver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>

    <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.65" />
    </filter>
  </defs>

  <!-- Solid Canvas Background for Full-Bleed iOS & Android compatibility -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Ambient Light Halo -->
  <circle cx="256" cy="230" r="170" fill="#38bdf8" opacity="0.15" filter="url(#glowEffect)" />
  <circle cx="256" cy="230" r="220" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.2" stroke-dasharray="6 8" />
  <circle cx="256" cy="230" r="185" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.1" />

  <!-- Main School Graduation Cap Emblem (Iconic 3D geometry) -->
  <g filter="url(#dropShadow)">
    <!-- Mortarboard Diamond (Top) -->
    <polygon points="256,70 450,165 256,260 62,165" fill="url(#accentCyan)" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" />
    
    <!-- Top Cap Bevel Highlight -->
    <polygon points="256,82 432,165 256,248 80,165" fill="#0f1f45" opacity="0.35" />
    <polygon points="256,82 256,248 80,165" fill="#38bdf8" opacity="0.3" />

    <!-- Cap Crown / Skull Cap Underneath -->
    <path d="M 140,215 L 140,285 C 140,345 372,345 372,285 L 372,215" fill="#0b1736" stroke="url(#accentCyan)" stroke-width="6" stroke-linejoin="round" />
    
    <!-- Center Button Pin -->
    <ellipse cx="256" cy="165" rx="14" ry="9" fill="url(#accentGold)" stroke="#ffffff" stroke-width="3" />

    <!-- Flowing Tassel -->
    <path d="M 256,165 Q 395,185 410,270" fill="none" stroke="url(#accentGold)" stroke-width="8" stroke-linecap="round" />
    <!-- Tassel Ribbon & Ring -->
    <circle cx="410" cy="275" r="10" fill="url(#accentGold)" stroke="#ffffff" stroke-width="2" />
    <path d="M 404,285 L 400,345 L 420,345 L 416,285 Z" fill="url(#accentGold)" />
  </g>

  <!-- Digital Smart Badge / Nexus Shield Bottom Crest -->
  <g transform="translate(256, 385)" filter="url(#dropShadow)">
    <!-- Smart Card Body -->
    <rect x="-135" y="-55" width="270" height="110" rx="20" fill="#ffffff" stroke="url(#accentCyan)" stroke-width="4" />
    
    <!-- Security Microchip Gold Plate -->
    <rect x="-115" y="-32" width="56" height="64" rx="8" fill="url(#accentGold)" stroke="#78350f" stroke-width="1.5" />
    <path d="M -115,-10 L -59,-10 M -115,12 L -59,12 M -87,-32 L -87,32" stroke="#78350f" stroke-width="1.5" opacity="0.6" />
    <rect x="-97" y="-12" width="20" height="24" rx="3" fill="#fbbf24" />

    <!-- Brand Typography inside badge -->
    <text x="-42" y="-10" font-family="'Noto Sans Thai', 'Inter', -apple-system, sans-serif" font-size="20" font-weight="900" fill="#0f172a" letter-spacing="1">SCHOOL</text>
    <text x="48" y="-10" font-family="'Noto Sans Thai', 'Inter', -apple-system, sans-serif" font-size="20" font-weight="900" fill="#0284c7" letter-spacing="1">NEXUS</text>
    
    <!-- Subtitle Bar -->
    <rect x="-42" y="5" width="160" height="4" rx="2" fill="#e2e8f0" />
    <rect x="-42" y="5" width="95" height="4" rx="2" fill="url(#accentCyan)" />
    
    <text x="-42" y="24" font-family="'Noto Sans Thai', 'Inter', -apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748b" letter-spacing="0.5">SMART CAMPUS ID</text>

    <!-- Signal Active Waves indicator -->
    <g transform="translate(108, -30)">
      <circle cx="0" cy="0" r="5" fill="#10b981" />
      <path d="M 8,-8 A 12,12 0 0,1 8,8" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 14,-14 A 20,20 0 0,1 14,14" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
    </g>
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve('public');
  const iconsDir = path.resolve('public/icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 1. Save SVG
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon, 'utf8');
  console.log('Saved icon.svg');

  const svgBuffer = Buffer.from(svgIcon);

  // 2. Generate PNGs:
  // - 512x512 (PWA & Android large)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // - 192x192 (PWA standard)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // - 180x180 (iOS Apple Touch Icon)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('Generated /icons/apple-touch-icon.png');

  // Also root level apple-touch-icon.png (iOS Safari looks here by default)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  console.log('Generated root apple-touch-icon.png');

  // - Favicon PNG 64x64 & 32x32
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('All icons generated successfully!');
}

run().catch(console.error);
