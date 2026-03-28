/**
 * Safe Trash Cleanup Script
 * Removes temporary files and build artifacts safely
 */

import fs from 'fs';
import path from 'path';

function safeDelete(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Check if directory is empty (safe to delete)
        const files = fs.readdirSync(filePath);
        if (files.length === 0) {
          fs.rmdirSync(filePath);
          console.log(`🗑️  Removed empty directory: ${description}`);
          return true;
        } else {
          console.log(`⚠️  Skipped non-empty directory: ${description}`);
          return false;
        }
      } else {
        // Only delete specific safe files
        const safeToDelete = [
          'asset-analysis.txt',
          'optimization-report.txt',
          'registerSW.js'
        ];
        
        const fileName = path.basename(filePath);
        if (safeToDelete.includes(fileName)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted file: ${description}`);
          return true;
        } else {
          console.log(`⚠️  Skipped unsafe file: ${description}`);
          return false;
        }
      }
    } else {
      console.log(`ℹ️  File doesn't exist: ${description}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to delete ${description}:`, error.message);
    return false;
  }
}

function cleanupTrash() {
  console.log('🧹 Starting safe trash cleanup...\n');
  
  let deletedCount = 0;
  let skippedCount = 0;
  
  // Safe files to delete (generated during our work)
  const filesToCheck = [
    {
      path: path.join(process.cwd(), 'asset-analysis.txt'),
      description: 'asset-analysis.txt (generated report)'
    },
    {
      path: path.join(process.cwd(), 'optimization-report.txt'),
      description: 'optimization-report.txt (generated report)'
    },
    {
      path: path.join(process.cwd(), 'dev-dist/registerSW.js'),
      description: 'dev-dist/registerSW.js (dev build file)'
    }
  ];
  
  // Check and delete safe files
  filesToCheck.forEach(item => {
    if (safeDelete(item.path, item.description)) {
      deletedCount++;
    } else {
      skippedCount++;
    }
  });
  
  // Check for empty directories
  const dirsToCheck = [
    {
      path: path.join(process.cwd(), 'dev-dist'),
      description: 'dev-dist/ (dev build directory)'
    }
  ];
  
  dirsToCheck.forEach(item => {
    if (safeDelete(item.path, item.description)) {
      deletedCount++;
    } else {
      skippedCount++;
    }
  });
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Deleted: ${deletedCount} items`);
  console.log(`   Skipped: ${skippedCount} items`);
  console.log('\n✅ Safe cleanup complete!');
  
  console.log('\n📝 Notes:');
  console.log('   - Only deleted generated/temporary files');
  console.log('   - Preserved all source code and important files');
  console.log('   - Build artifacts in dist/ kept (needed for deployment)');
  console.log('   - Node modules and dependencies preserved');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupTrash();
}

export { cleanupTrash };
