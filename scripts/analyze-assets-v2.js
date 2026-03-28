/**
 * Asset Analysis with File Output
 * Writes results to a file for visibility
 */

import fs from 'fs';
import path from 'path';

function analyzeDirectory(dir, label) {
  if (!fs.existsSync(dir)) {
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
  const results = [];

  // Analyze audio files
  const audioDir = path.join(process.cwd(), 'public/audio');
  const audioData = analyzeDirectory(audioDir, 'Audio');
  
  results.push('🎵 AUDIO FILES:');
  results.push(`   Total: ${formatSize(audioData.totalSize)} (${audioData.fileCount} files)`);
  audioData.files.forEach(file => {
    const filePath = path.join(audioDir, file);
    const stats = fs.statSync(filePath);
    results.push(`   - ${file}: ${formatSize(stats.size)}`);
  });

  // Analyze image files
  const publicDir = path.join(process.cwd(), 'public');
  const imageData = analyzeDirectory(publicDir, 'Images');
  
  results.push('\n🖼️  IMAGE FILES:');
  results.push(`   Total: ${formatSize(imageData.totalSize)} (${imageData.fileCount} files)`);
  imageData.files.forEach(file => {
    const filePath = path.join(publicDir, file);
    const stats = fs.statSync(filePath);
    results.push(`   - ${file}: ${formatSize(stats.size)}`);
  });

  // Summary
  const totalSize = audioData.totalSize + imageData.totalSize;
  results.push('\n📊 SUMMARY:');
  results.push(`   Total assets: ${formatSize(totalSize)}`);
  results.push(`   Audio: ${formatSize(audioData.totalSize)} (${((audioData.totalSize / totalSize) * 100).toFixed(1)}%)`);
  results.push(`   Images: ${formatSize(imageData.totalSize)} (${((imageData.totalSize / totalSize) * 100).toFixed(1)}%)`);

  results.push('\n💡 OPTIMIZATION POTENTIAL:');
  if (audioData.totalSize > 0) {
    const audioSavings = audioData.totalSize * 0.3;
    results.push(`   - Audio compression: ${formatSize(audioSavings)} savings (30%)`);
  }
  if (imageData.totalSize > 0) {
    const imageSavings = imageData.totalSize * 0.25;
    results.push(`   - WebP conversion: ${formatSize(imageSavings)} savings (25%)`);
  }

  // Write to file
  const outputPath = path.join(process.cwd(), 'asset-analysis.txt');
  fs.writeFileSync(outputPath, results.join('\n'), 'utf8');
  
  return results;
}

const analysis = analyzeAssets();

// Also try console output
analysis.forEach(line => console.log(line));
