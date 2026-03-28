/**
 * Simple Asset Test Script
 * Quick test to see if scripts are working
 */

console.log('🧪 Testing script execution...');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);

import fs from 'fs';
import path from 'path';

// Test reading audio directory
const audioDir = path.join(process.cwd(), 'public/audio');
console.log('\n📍 Checking audio directory:', audioDir);

if (fs.existsSync(audioDir)) {
  const files = fs.readdirSync(audioDir);
  console.log('✅ Audio directory exists');
  console.log('📁 Files found:', files.length);
  
  const mp3Files = files.filter(f => f.endsWith('.mp3'));
  console.log('🎵 MP3 files:', mp3Files.length);
  
  if (mp3Files.length > 0) {
    mp3Files.slice(0, 3).forEach(file => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file}: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    });
  }
} else {
  console.log('❌ Audio directory not found');
}

// Test public directory
const publicDir = path.join(process.cwd(), 'public');
console.log('\n📍 Checking public directory:', publicDir);

if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  console.log('✅ Public directory exists');
  console.log('📁 Files found:', files.length);
  
  const imageFiles = files.filter(f => 
    f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
  );
  console.log('🖼️  Image files:', imageFiles.length);
} else {
  console.log('❌ Public directory not found');
}

console.log('\n✅ Script test complete!');
