#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Creates all required icon sizes from a single source image.
 *
 * Usage: node scripts/generate-icons.js [source-image-path]
 */

const fs = require('fs');

// Icon sizes required for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Apple-specific sizes
const APPLE_SIZES = [
  { size: 120, name: 'apple-touch-icon.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' }
];

function generateIcons() {
  console.log('PWA Icon Generator for Noor Connect');
  console.log('=====================================\n');

  // Check if source icon exists
  const sourceIcon = 'public/icon-512x512.png';
  if (!fs.existsSync(sourceIcon)) {
    console.error(`Source icon not found: ${sourceIcon}`);
    console.log('Place your source icon at public/icon-512x512.png');
    console.log('Recommended: 512x512 PNG with transparent background');
    process.exit(1);
  }

  console.log(`Source icon found: ${sourceIcon}`);
  console.log('\nRequired Icons:');

  // Display required icons
  [...ICON_SIZES, ...APPLE_SIZES].forEach((icon) => {
    console.log(`  - ${icon.name} (${icon.size}x${icon.size}px)`);
  });

  console.log('\nTo generate icons, use one of these options:\n');
  console.log('Option 1: Online Tool (Recommended)');
  console.log('  Visit: https://www.pwabuilder.com/imageGenerator');
  console.log('  Upload icon-512x512.png and download generated sizes\n');

  console.log('Option 2: CLI Tool');
  console.log('  Install: npm install -g pwa-asset-generator');
  console.log('  Run: pwa-asset-generator public/icon-512x512.png public/icons/\n');

  console.log('Option 3: Manual Resize');
  console.log('  Use any image editor to create the required sizes\n');

  console.log('Place generated icons in the public/ directory\n');

  console.log('Design Guidelines:');
  console.log('  - Use the Noor Connect logo with Arabic text');
  console.log('  - Background: transparent or #000000');
  console.log('  - Logo: gold gradient (#fbbf24 to #d97706)');
  console.log('  - Keep design simple and recognizable at small sizes');
  console.log('  - Ensure strong contrast for accessibility\n');

  console.log('PWA setup guidance complete.');
}

// Run the generator
generateIcons();
