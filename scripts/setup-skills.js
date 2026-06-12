const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.gemini/antigravity-ide/skills');
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

    // 1. Ensure the skill is in the global location
    if (!fs.existsSync(globalSkillPath)) {
      console.log(`Skill ${skillKey} is not present in global location: ${globalSkillPath}`);
      
      // Check if we already have it locally as a regular directory
      const localExists = fs.existsSync(localSkillPath);
      const isSymlink = localExists && fs.lstatSync(localSkillPath).isSymbolicLink();

      if (localExists && !isSymlink) {
        console.log(`Found local directory for ${skillKey}. Moving to global location...`);
        // Move local directory to global location
        try {
          fs.renameSync(localSkillPath, globalSkillPath);
        } catch (renameErr) {
          // Fallback if fs.rename fails across filesystems
          runCommand(`cp -R "${localSkillPath}" "${globalSkillPath}"`);
          runCommand(`rm -rf "${localSkillPath}"`);
        }
      } else {
        // Not present globally or locally. Fetch/pull it!
        console.log(`Fetching ${skillKey} from ${skillData.source}...`);
        
        // Clean up any existing local link/file
        if (localExists) {
          fs.unlinkSync(localSkillPath);
        }

        const source = skillData.source;
        const fetchCmd = `npx -y skills add "${source}" --skill "${skillKey}" --copy`;
        const success = runCommand(fetchCmd);

        if (success && fs.existsSync(localSkillPath)) {
          console.log(`Successfully fetched. Moving to global location...`);
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
      }
    } else {
      console.log(`Skill ${skillKey} is already present globally.`);
    }

    // 2. Set up the local symlink to the global location
    const localExists = fs.existsSync(localSkillPath);
    const isSymlink = localExists && fs.lstatSync(localSkillPath).isSymbolicLink();

    if (localExists) {
      if (isSymlink) {
        // Verify it points to the correct place
        const target = fs.readlinkSync(localSkillPath);
        if (target === globalSkillPath) {
          console.log(`Symlink is already correct for ${skillKey}.`);
          continue;
        } else {
          console.log(`Incorrect symlink target: ${target}. Re-creating...`);
          fs.unlinkSync(localSkillPath);
        }
      } else {
        console.log(`Local directory exists but is not a symlink. Removing and replacing...`);
        runCommand(`rm -rf "${localSkillPath}"`);
      }
    }

    console.log(`Creating symlink from ${localSkillPath} to ${globalSkillPath}...`);
    fs.symlinkSync(globalSkillPath, localSkillPath, 'dir');
  }

  console.log('\nAll skills successfully configured!');
}

setup();
