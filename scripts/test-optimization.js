/**
 * Test Optimization Script
 * Validates optimized assets and compares sizes
 */

import fs from 'fs';
import path from 'path';

function analyzeDirectory(dir, label) {
  if (!fs.existsSync(dir)) {
    console.log(`❌ ${label} directory not found: ${dir}`);
    return { totalSize: 0, fileCount: 0 };
  }

  const files = fs.readdirSync(dir);
  let totalSize = 0;
  let fileCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
    fileCount++;
  });

  return { totalSize, fileCount };
}

function formatSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function runOptimizationTest() {
  console.log('🔍 Analyzing current vs optimized assets...\n');

  // Analyze original assets
  const originalAudio = analyzeDirectory(
    path.join(__dirname, '../public/audio'),
    'Original Audio'
  );
  
  const originalImages = analyzeDirectory(
    path.join(__dirname, '../public'),
    'Original Images'
  );

  // Analyze optimized assets
  const optimizedAudio = analyzeDirectory(
    path.join(__dirname, '../public/audio/optimized'),
    'Optimized Audio'
  );
  
  const optimizedImages = analyzeDirectory(
    path.join(__dirname, '../public/optimized'),
    'Optimized Images'
  );

  // Results
  console.log('📊 Results:');
  console.log('\n🎵 Audio:');
  console.log(`   Original: ${formatSize(originalAudio.totalSize)} (${originalAudio.fileCount} files)`);
  console.log(`   Optimized: ${formatSize(optimizedAudio.totalSize)} (${optimizedAudio.fileCount} files)`);
  
  if (originalAudio.totalSize > 0 && optimizedAudio.totalSize > 0) {
    const audioSavings = ((originalAudio.totalSize - optimizedAudio.totalSize) / originalAudio.totalSize * 100).toFixed(1);
    const audioSavedMB = (originalAudio.totalSize - optimizedAudio.totalSize) / 1024 / 1024;
    console.log(`   Savings: ${audioSavings}% (${audioSavedMB.toFixed(2)}MB)`);
  }

  console.log('\n🖼️  Images:');
  console.log(`   Original: ${formatSize(originalImages.totalSize)} (${originalImages.fileCount} files)`);
  console.log(`   Optimized: ${formatSize(optimizedImages.totalSize)} (${optimizedImages.fileCount} files)`);
  
  if (originalImages.totalSize > 0 && optimizedImages.totalSize > 0) {
    const imageSavings = ((originalImages.totalSize - optimizedImages.totalSize) / originalImages.totalSize * 100).toFixed(1);
    const imageSavedMB = (originalImages.totalSize - optimizedImages.totalSize) / 1024 / 1024;
    console.log(`   Savings: ${imageSavings}% (${imageSavedMB.toFixed(2)}MB)`);
  }

  console.log('\n✅ Optimization analysis complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOptimizationTest();
}

export { runOptimizationTest };
