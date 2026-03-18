import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Sync versions between package.json and android/app/build.gradle
function syncVersion() {
    try {
        const pkgPath = path.join(rootDir, 'package.json');
        const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');

        if (!fs.existsSync(pkgPath) || !fs.existsSync(gradlePath)) {
            console.log('Skipping version sync: package.json or build.gradle not found');
            return;
        }

        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const version = pkg.version;
        
        let gradleContent = fs.readFileSync(gradlePath, 'utf8');
        let updated = false;

        // Update versionName
        const versionNameRegex = /versionName\s+"[^"]+"/;
        const newVersionName = `versionName "${version}"`;
        if (versionNameRegex.test(gradleContent)) {
            const current = gradleContent.match(versionNameRegex)[0];
            if (current !== newVersionName) {
                gradleContent = gradleContent.replace(versionNameRegex, newVersionName);
                updated = true;
                console.log(`Updated versionName to ${version}`);
            }
        }

        // Auto-increment versionCode if version changed
        if (updated) {
            const versionCodeRegex = /versionCode\s+(\d+)/;
            const match = gradleContent.match(versionCodeRegex);
            if (match) {
                const currentCode = parseInt(match[1]);
                const newCode = currentCode + 1;
                gradleContent = gradleContent.replace(versionCodeRegex, `versionCode ${newCode}`);
                console.log(`Incremented versionCode to ${newCode}`);
            }
        }

        if (updated) {
            fs.writeFileSync(gradlePath, gradleContent);
            console.log('Successfully synced Android versions with package.json');
        } else {
            console.log('Versions are already in sync.');
        }

    } catch (error) {
        console.error('Error syncing versions:', error);
    }
}

syncVersion();
