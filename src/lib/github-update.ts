/**
 * GitHub Update Service
 * Fetches latest release from GitHub API and compares versions
 */

const GITHUB_OWNER = 'darkmaster0345';
const GITHUB_REPO = 'Noor-connect';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

const STORAGE_KEYS = {
  LAST_CHECKED: 'last-update-check',
  CURRENT_VERSION: 'app-version',
};

export const CURRENT_APP_VERSION = '1.1.2';

const RATE_LIMIT_MS = 60 * 60 * 1000;

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
  published_at: string;
}

export type UpdateCheckResult = 
  | { hasUpdate: true; release: GitHubRelease; currentVersion: string; latestVersion: string }
  | { hasUpdate: false; currentVersion: string; latestVersion: string }
  | { error: true; message: string; isRateLimited?: boolean };

function parseVersion(version: string): number[] {
  const cleanVersion = version.replace(/^v/, '');
  return cleanVersion.split('.').map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 !== p2) return p1 - p2;
  }
  return 0;
}

export function getLastCheckedTimestamp(): number | null {
  const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_CHECKED);
  return timestamp ? parseInt(timestamp, 10) : null;
}

export function setLastCheckedTimestamp(): void {
  localStorage.setItem(STORAGE_KEYS.LAST_CHECKED, Date.now().toString());
}

export function shouldSkipRateLimitCheck(): boolean {
  const lastChecked = getLastCheckedTimestamp();
  if (!lastChecked) return false;
  return Date.now() - lastChecked < RATE_LIMIT_MS;
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Noor-Connect-App',
      },
    });

    if (response.status === 403) {
      console.warn('GitHub API rate limit reached');
      return null;
    }

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as GitHubRelease;
  } catch (error) {
    console.error('Failed to fetch GitHub release:', error);
    return null;
  }
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  if (shouldSkipRateLimitCheck()) {
    const lastChecked = getLastCheckedTimestamp();
    const nextCheckTime = lastChecked ? lastChecked + RATE_LIMIT_MS : 0;
    const waitTime = Math.max(0, nextCheckTime - Date.now());
    const minutes = Math.ceil(waitTime / 60000);
    return {
      error: true,
      message: `Please wait ${minutes} minute(s) before checking again`,
      isRateLimited: true,
    };
  }

  setLastCheckedTimestamp();
  const release = await fetchLatestRelease();
  
  if (!release) {
    return { error: true, message: 'Unable to check for updates. Please try again later.' };
  }

  const latestVersion = release.tag_name.replace(/^v/, '');
  const currentVersion = CURRENT_APP_VERSION;
  const comparison = compareVersions(currentVersion, latestVersion);

  if (comparison < 0) {
    return { hasUpdate: true, release, currentVersion, latestVersion };
  }

  return { hasUpdate: false, currentVersion, latestVersion };
}

export function getDownloadUrl(release: GitHubRelease): string | null {
  const apkAsset = release.assets.find(asset => 
    asset.name.toLowerCase().endsWith('.apk')
  );
  
  if (apkAsset) {
    return apkAsset.browser_download_url;
  }

  if (release.assets.length > 0) {
    return release.assets[0].browser_download_url;
  }

  return release.html_url;
}

export function formatReleaseNotes(body: string, maxLength: number = 500): string {
  let notes = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[-*]\s/g, '')
    .trim();

  if (notes.length > maxLength) {
    notes = notes.substring(0, maxLength).trim() + '...';
  }

  return notes;
}
