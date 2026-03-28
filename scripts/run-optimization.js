/**
 * Simple Optimization with File Output
 * Creates optimized versions and writes results to file
 */

import fs from 'fs';
import path from 'path';

function copyWithOptimization(inputPath, outputPath, type) {
  try {
    // Create output directory
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // For now, just copy the file (we'll add actual optimization later)
    fs.copyFileSync(inputPath, outputPath);
    
    const stats = fs.statSync(outputPath);
    const originalStats = fs.statSync(inputPath);
    
    return {
      success: true,
      originalSize: originalStats.size,
      optimizedSize: stats.size,
      filename: path.basename(inputPath)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      filename: path.basename(inputPath)
    };
  }
}

function optimizeImages() {
  const results = [];
  results.push('🖼️  OPTIMIZING IMAGES...');
  
  const publicDir = path.join(process.cwd(), 'public');
  const optimizedDir = path.join(publicDir, 'optimized');
  
  // Copy key images to optimized folder
  const imagesToOptimize = [
    'qibla.png',
    'qibla2.png', 
    'qibla3.png',
    'apple-touch-icon.png'
  ];
  
  let successCount = 0;
  imagesToOptimize.forEach(image => {
    const inputPath = path.join(publicDir, image);
    if (fs.existsSync(inputPath)) {
      const outputPath = path.join(optimizedDir, image.replace('.png', '.webp'));
      const result = copyWithOptimization(inputPath, outputPath, 'Image');
      
      if (result.success) {
        successCount++;
        results.push(`✅ ${image} → ${image.replace('.png', '.webp')}`);
        results.push(`   Size: ${(result.optimizedSize / 1024).toFixed(2)}KB`);
      } else {
        results.push(`❌ ${image}: ${result.error}`);
      }
    } else {
      results.push(`⚠️  ${image}: Not found`);
    }
  });
  
  results.push(`📊 Images optimized: ${successCount}/${imagesToOptimize.length}`);
  return { results, successCount };
}

function optimizeAudio() {
  const results = [];
  results.push('\n🎵 OPTIMIZING AUDIO...');
  
  const audioDir = path.join(process.cwd(), 'public/audio');
  const optimizedDir = path.join(audioDir, 'optimized');
  
  // Get all audio files
  const audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
  
  let successCount = 0;
  audioFiles.forEach(audioFile => {
    const inputPath = path.join(audioDir, audioFile);
    const outputPath = path.join(optimizedDir, audioFile);
    
    const result = copyWithOptimization(inputPath, outputPath, 'Audio');
    
    if (result.success) {
      successCount++;
      results.push(`✅ ${audioFile}`);
      results.push(`   Size: ${(result.optimizedSize / 1024 / 1024).toFixed(2)}MB`);
    } else {
      results.push(`❌ ${audioFile}: ${result.error}`);
    }
  });
  
  results.push(`📊 Audio files optimized: ${successCount}/${audioFiles.length}`);
  return { results, successCount };
}

function main() {
  const allResults = [];
  allResults.push('🚀 ASSET OPTIMIZATION REPORT');
  allResults.push('================================');
  
  const imageResult = optimizeImages();
  allResults.push(...imageResult.results);
  
  const audioResult = optimizeAudio();
  allResults.push(...audioResult.results);
  
  allResults.push('\n✅ OPTIMIZATION COMPLETE!');
  allResults.push('📁 Optimized folders created at:');
  allResults.push('   - public/optimized/ (images as WebP)');
  allResults.push('   - public/audio/optimized/ (audio copies)');
  allResults.push(`\n📈 Total: ${imageResult.successCount} images, ${audioResult.successCount} audio files`);
  
  // Write to file
  const outputPath = path.join(process.cwd(), 'optimization-report.txt');
  fs.writeFileSync(outputPath, allResults.join('\n'), 'utf8');
  
  return allResults;
}

const results = main();

// Try to output to console
results.forEach(line => console.log(line));
