import fs from 'fs';
import path from 'path';

const devDistPath = path.join(process.cwd(), 'dev-dist');

try {
  if (fs.existsSync(devDistPath)) {
    const files = fs.readdirSync(devDistPath);
    console.log('Files in dev-dist:', files);
    
    // Delete registerSW.js if it exists
    const registerSWPath = path.join(devDistPath, 'registerSW.js');
    if (fs.existsSync(registerSWPath)) {
      fs.unlinkSync(registerSWPath);
      console.log('✅ Deleted registerSW.js');
    }
    
    // Try to remove the directory
    try {
      fs.rmdirSync(devDistPath);
      console.log('✅ Removed dev-dist directory');
    } catch (error) {
      console.log('⚠️  dev-dist not empty, keeping directory');
    }
  } else {
    console.log('ℹ️  dev-dist directory does not exist');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}
