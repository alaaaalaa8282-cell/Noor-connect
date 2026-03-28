/**
 * Image Optimization Script
 * Converts images to WebP and creates responsive sizes
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Image optimization settings
const OPTIMIZATION_CONFIG = {
  // Icons - keep original format for compatibility
  icons: {
    sizes: [96, 72, 512, 384, 192, 152, 144, 128],
    formats: ['png'], // Keep PNG for icons
    quality: 90
  },
  // Content images - convert to WebP
  content: {
    formats: ['webp', 'png'], // WebP + PNG fallback
    quality: 85,
    sizes: [400, 800, 1200] // Responsive sizes
  }
};

function optimizeImage(inputPath, outputPath, options) {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use sharp for image processing (if available) or fallback to imagemin
    const command = `npx sharp "${inputPath}" --output "${outputPath}" --quality ${options.quality}`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Optimized: ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
  }
}

function processImages() {
  const publicDir = path.join(__dirname, '../public');
  const outputDir = path.join(__dirname, '../public/optimized');

  // Process icons (keep PNG)
  const iconFiles = [
    'icon-96x96.png',
    'icon-72x72.png', 
    'icon-512x512.png',
    'icon-384x384.png',
    'icon-192x192.png',
    'icon-152x152.png',
    'icon-144x144.png',
    'icon-128x128.png',
    'favicon.png'
  ];

  console.log('🔧 Processing app icons...');
  iconFiles.forEach(file => {
    const inputPath = path.join(publicDir, file);
    if (fs.existsSync(inputPath)) {
      // Copy icons as-is (no conversion for compatibility)
      const outputPath = path.join(outputDir, file);
      fs.copyFileSync(inputPath, outputPath);
      console.log(`📋 Copied icon: ${file}`);
    }
  });

  // Process content images (convert to WebP)
  console.log('🔧 Processing content images...');
  const contentImages = ['qibla.png', 'apple-touch-icon.png'];
  
  contentImages.forEach(file => {
    const inputPath = path.join(publicDir, file);
    if (fs.existsSync(inputPath)) {
      // Create WebP version
      const webpPath = path.join(outputDir, file.replace('.png', '.webp'));
      optimizeImage(inputPath, webpPath, { quality: 85 });
      
      // Create responsive sizes
      OPTIMIZATION_CONFIG.content.sizes.forEach(size => {
        const resizedPath = path.join(outputDir, `${size}-${file.replace('.png', '.webp')}`);
        const command = `npx sharp "${inputPath}" --resize ${size} --output "${resizedPath}" --quality 85`;
        try {
          execSync(command, { stdio: 'inherit' });
          console.log(`📐 Created ${size}px version: ${resizedPath}`);
        } catch (error) {
          console.error(`❌ Failed to create ${size}px version:`, error.message);
        }
      });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processImages();
}

export { processImages, OPTIMIZATION_CONFIG };
