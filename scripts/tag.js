const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Path constants
const CWD = process.cwd();
const PACKAGE_JSON_PATH = path.join(CWD, 'package.json');
const APP_JSON_PATH = path.join(CWD, 'app.json');
const VERSION_TS_PATH = path.join(CWD, 'constants/version.ts');
const CHANGELOG_UPCOMING_PATH = path.join(CWD, 'changelog/upcoming.md');
const CHANGELOG_INDEX_PATH = path.join(CWD, 'CHANGELOG.md');
const CHANGELOG_DIR = path.join(CWD, 'changelog');

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
}

// 1. Calculate default version (YYYYMMDD.N)
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function getNextVersion() {
  const today = getTodayDateString();
  let maxN = 0;
  
  if (fs.existsSync(CHANGELOG_DIR)) {
    const files = fs.readdirSync(CHANGELOG_DIR);
    const regex = new RegExp(`^${today}\\.(\\d+)\\.md$`);
    for (const file of files) {
      const match = file.match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxN) maxN = n;
      }
    }
  }

  // Also check git tags just in case
  try {
    const tags = execSync(`git tag --list "${today}.*"`, { encoding: 'utf8' })
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    const regex = new RegExp(`^${today}\\.(\\d+)$`);
    for (const tag of tags) {
      const match = tag.match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxN) maxN = n;
      }
    }
  } catch (e) {
    // Git might not have tags or fail, ignore
  }

  const nextN = maxN + 1;
  return `${today}.${nextN}`;
}

// 2. Validate changelog/upcoming.md has content
function getUpcomingContent() {
  if (!fs.existsSync(CHANGELOG_UPCOMING_PATH)) {
    console.error(`Error: ${CHANGELOG_UPCOMING_PATH} does not exist!`);
    process.exit(1);
  }

  const content = fs.readFileSync(CHANGELOG_UPCOMING_PATH, 'utf8').trim();
  const lines = content.split('\n').map(l => l.trim());

  // Check if upcoming has actual entries besides ## Unreleased
  const hasEntries = lines.some(line => line.startsWith('-') || line.startsWith('*'));
  if (!hasEntries) {
    console.error('Error: No new changes found in changelog/upcoming.md.');
    console.error('Please document your changes in changelog/upcoming.md first.');
    process.exit(1);
  }

  return content;
}

// Main release execution
async function main() {
  // Check working tree clean status (optional warning)
  const status = runCommand('git status --porcelain');
  if (status) {
    console.log('\n⚠️  Warning: Working tree is not clean. The following files will be added to the commit:');
    console.log(status);
    console.log('');
  }

  const upcomingContent = getUpcomingContent();
  const calculatedVersion = getNextVersion();
  let selectedVersion = process.argv[2] || '';

  if (!selectedVersion) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    selectedVersion = await new Promise((resolve) => {
      rl.question(`Confirm release version [Default: ${calculatedVersion}]: `, (answer) => {
        rl.close();
        resolve(answer.trim() || calculatedVersion);
      });
    });
  }

  // Validate format YYYYMMDD.N
  const versionRegex = /^\d{8}\.\d+$/;
  if (!versionRegex.test(selectedVersion)) {
    console.error(`Error: Version "${selectedVersion}" must follow YYYYMMDD.N format (e.g. ${calculatedVersion}).`);
    process.exit(1);
  }

  console.log(`\nStarting release process for version: ${selectedVersion}`);

  // 3. Create changelog/<version>.md
  const newChangelogPath = path.join(CHANGELOG_DIR, `${selectedVersion}.md`);
  const header = `# Release ${selectedVersion}\n\n`;
  const cleanContent = upcomingContent.replace(/^## Unreleased\s*/i, '');
  fs.writeFileSync(newChangelogPath, header + cleanContent + '\n', 'utf8');
  console.log(`✅ Created ${newChangelogPath}`);

  // 4. Reset changelog/upcoming.md
  fs.writeFileSync(CHANGELOG_UPCOMING_PATH, '## Unreleased\n', 'utf8');
  console.log(`✅ Reset ${CHANGELOG_UPCOMING_PATH}`);

  // 5. Update package.json
  if (fs.existsSync(PACKAGE_JSON_PATH)) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    pkg.version = selectedVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated package.json version to ${selectedVersion}`);
  }

  // 6. Update app.json
  if (fs.existsSync(APP_JSON_PATH)) {
    const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
    if (appJson.expo) {
      appJson.expo.version = selectedVersion;
      fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
      console.log(`✅ Updated app.json version to ${selectedVersion}`);
    }
  }

  // 7. Update constants/version.ts
  fs.writeFileSync(VERSION_TS_PATH, `export const APP_VERSION = '${selectedVersion}';\n`, 'utf8');
  console.log(`✅ Updated constants/version.ts to ${selectedVersion}`);

  // 8. Update CHANGELOG.md index links
  if (fs.existsSync(CHANGELOG_INDEX_PATH)) {
    let changelogIdx = fs.readFileSync(CHANGELOG_INDEX_PATH, 'utf8');
    const versionLink = `- [${selectedVersion}](changelog/${selectedVersion}.md)`;
    
    if (changelogIdx.includes(versionLink)) {
      console.log('ℹ️ CHANGELOG.md already contains the version link.');
    } else {
      // Insert right after ## Versions
      const marker = '## Versions';
      const markerIndex = changelogIdx.indexOf(marker);
      if (markerIndex !== -1) {
        const insertAt = markerIndex + marker.length;
        changelogIdx = changelogIdx.slice(0, insertAt) + `\n${versionLink}` + changelogIdx.slice(insertAt);
        fs.writeFileSync(CHANGELOG_INDEX_PATH, changelogIdx, 'utf8');
        console.log(`✅ Added version link to CHANGELOG.md`);
      } else {
        console.warn('⚠️ Could not find "## Versions" header in CHANGELOG.md. Please update index manually.');
      }
    }
  }

  // 9. Git Add, Commit, Tag
  console.log('\nRunning git commands...');
  try {
    runCommand('git add package.json app.json constants/version.ts CHANGELOG.md changelog/');
    runCommand(`git commit -m "Release ${selectedVersion}"`);
    runCommand(`git tag -a "${selectedVersion}" -m "Release ${selectedVersion}"`);
    console.log(`\n🎉 Successfully tagged release: ${selectedVersion}`);
    console.log(`To push commit and tag upstream, run:\n   git push origin main --tags\n`);
  } catch (err) {
    console.error('Git commands failed. Please complete committing and tagging manually.');
  }
}

main();
