const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.agents/skills');
const LOCAL_SKILLS_DIR = path.join(process.cwd(), '.agents/skills');
const LOCK_FILE = path.join(process.cwd(), 'skills-lock.json');

// Ensure directories exist
fs.mkdirSync(GLOBAL_SKILLS_DIR, { recursive: true });
fs.mkdirSync(LOCAL_SKILLS_DIR, { recursive: true });

function runCommand(cmd) {
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${cmd}`, error);
    return false;
  }
}

function copyDirectory(src, dest) {
  // Ensure destination exists
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function setup() {
  if (!fs.existsSync(LOCK_FILE)) {
    console.error(`Error: ${LOCK_FILE} not found.`);
    process.exit(1);
  }

  const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
  const skills = lock.skills || {};

  for (const [skillKey, skillData] of Object.entries(skills)) {
    console.log(`\n--- Setting up skill: ${skillKey} ---`);
    const globalSkillPath = path.join(GLOBAL_SKILLS_DIR, skillKey);
    const localSkillPath = path.join(LOCAL_SKILLS_DIR, skillKey);

    // 1. Ensure the skill is in the global cache
    if (!fs.existsSync(globalSkillPath)) {
      console.log(`Skill ${skillKey} is not present in global cache: ${globalSkillPath}`);
      console.log(`Fetching ${skillKey} from ${skillData.source}...`);
      
      // Clean up any existing local link/file first
      if (fs.existsSync(localSkillPath)) {
        runCommand(`rm -rf "${localSkillPath}"`);
      }

      const source = skillData.source;
      const fetchCmd = `npx -y skills add "${source}" --skill "${skillKey}" --copy`;
      const success = runCommand(fetchCmd);

      if (success && fs.existsSync(localSkillPath)) {
        console.log(`Successfully fetched. Moving to global cache...`);
        try {
          fs.renameSync(localSkillPath, globalSkillPath);
        } catch (renameErr) {
          runCommand(`cp -R "${localSkillPath}" "${globalSkillPath}"`);
          runCommand(`rm -rf "${localSkillPath}"`);
        }
      } else {
        console.error(`Failed to fetch skill: ${skillKey}`);
        continue;
      }
    } else {
      console.log(`Skill ${skillKey} is present in global cache.`);
    }

    // 2. Set up the local copy (no symlinks, fully local)
    const localExists = fs.existsSync(localSkillPath);
    const isSymlink = localExists && fs.lstatSync(localSkillPath).isSymbolicLink();

    if (localExists) {
      console.log(`Cleaning up existing local ${isSymlink ? 'symlink' : 'directory'} for ${skillKey}...`);
      runCommand(`rm -rf "${localSkillPath}"`);
    }

    console.log(`Copying skill from global cache to local project: ${localSkillPath}`);
    try {
      copyDirectory(globalSkillPath, localSkillPath);
    } catch (copyErr) {
      console.log(`Fallback copy using shell command...`);
      runCommand(`cp -R "${globalSkillPath}" "${localSkillPath}"`);
    }
  }

  console.log('\nAll skills successfully configured!');
}

setup();
