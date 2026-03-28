/**
 * Simple Asset Analysis Script
 * Analyzes current assets without external dependencies
 */

import fs from 'fs';
import path from 'path';

function analyzeDirectory(dir, label) {
  if (!fs.existsSync(dir)) {
    console.log(`❌ ${label} directory not found: ${dir}`);
    return { totalSize: 0, fileCount: 0, files: [] };
  }

  const files = fs.readdirSync(dir).filter(file => 
    file.endsWith('.mp3') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
  );
  let totalSize = 0;
  let fileCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
    fileCount++;
  });

  return { totalSize, fileCount, files };
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  }
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function analyzeAssets() {
  console.log('🔍 Analyzing current assets...\n');

  // Analyze audio files
  const audioDir = path.join(process.cwd(), 'public/audio');
  console.log(`📍 Audio directory: ${audioDir}`);
  
  const audioData = analyzeDirectory(audioDir, 'Audio');
  
  console.log(`🎵 Audio Files (${audioData.fileCount} found):`);
  if (audioData.fileCount > 0) {
    console.log(`   Total: ${formatSize(audioData.totalSize)}`);
    audioData.files.forEach(file => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file}: ${formatSize(stats.size)}`);
    });
  } else {
    console.log('   ❌ No audio files found');
  }

  // Analyze image files
  const publicDir = path.join(process.cwd(), 'public');
  const imageData = analyzeDirectory(publicDir, 'Images');
  
  console.log('\n🖼️  Image Files:');
  console.log(`   Total: ${formatSize(imageData.totalSize)} (${imageData.fileCount} files)`);
  imageData.files.forEach(file => {
    const filePath = path.join(publicDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   - ${file}: ${formatSize(stats.size)}`);
  });

  console.log('\n📊 Summary:');
  const totalSize = audioData.totalSize + imageData.totalSize;
  console.log(`   Total assets: ${formatSize(totalSize)}`);
  console.log(`   Audio: ${formatSize(audioData.totalSize)} (${((audioData.totalSize / totalSize) * 100).toFixed(1)}%)`);
  console.log(`   Images: ${formatSize(imageData.totalSize)} (${((imageData.totalSize / totalSize) * 100).toFixed(1)}%)`);

  console.log('\n💡 Optimization Recommendations:');
  if (audioData.totalSize > 0) {
    console.log('   - Audio can be compressed to ~70% of current size');
    console.log(`   - Potential savings: ${formatSize(audioData.totalSize * 0.3)}`);
  }
  if (imageData.totalSize > 0) {
    console.log('   - Images can be converted to WebP format');
    console.log(`   - Potential savings: ${formatSize(imageData.totalSize * 0.25)}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeAssets();
}

export { analyzeAssets };
