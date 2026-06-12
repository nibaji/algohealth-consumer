const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOCAL_SKILLS_DIR = path.join(process.cwd(), '.agents/skills');
const TMP_DIR = path.join(process.cwd(), '.agents/tmp_skills');
const LOCK_FILE = path.join(process.cwd(), 'skills-lock.json');

// Ensure directories exist
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

  // Group skills by their github source repo
  const repoGroups = {};
  for (const [skillKey, skillData] of Object.entries(skills)) {
    const repo = skillData.source;
    if (!repoGroups[repo]) {
      repoGroups[repo] = [];
    }
    repoGroups[repo].push({ key: skillKey, data: skillData });
  }

  // Ensure fresh temp dir
  if (fs.existsSync(TMP_DIR)) {
    runCommand(`rm -rf "${TMP_DIR}"`);
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });

  try {
    for (const [repo, repoSkills] of Object.entries(repoGroups)) {
      console.log(`\n--- Cloning repository: ${repo} ---`);
      const repoFolderName = repo.replace(/\//g, '_');
      const repoPath = path.join(TMP_DIR, repoFolderName);
      
      const cloneSuccess = runCommand(`git clone --depth 1 "https://github.com/${repo}.git" "${repoPath}"`);
      if (!cloneSuccess) {
        console.error(`Failed to clone repository: ${repo}. Skipping skills: ${repoSkills.map(s => s.key).join(', ')}`);
        continue;
      }

      for (const skill of repoSkills) {
        console.log(`Setting up local skill: ${skill.key}`);
        const localSkillPath = path.join(LOCAL_SKILLS_DIR, skill.key);
        
        // Clean up any existing local skill folder or symlink
        if (fs.existsSync(localSkillPath)) {
          runCommand(`rm -rf "${localSkillPath}"`);
        }

        const skillRelativeDir = path.dirname(skill.data.skillPath);
        const sourceSkillPath = path.join(repoPath, skillRelativeDir);

        if (!fs.existsSync(sourceSkillPath)) {
          console.error(`Error: Skill path ${sourceSkillPath} does not exist in repo ${repo}`);
          continue;
        }

        console.log(`Copying ${skill.key} to local workspace...`);
        try {
          copyDirectory(sourceSkillPath, localSkillPath);
        } catch (copyErr) {
          runCommand(`cp -R "${sourceSkillPath}" "${localSkillPath}"`);
        }
      }
    }
  } finally {
    // Always clean up temp directory
    console.log(`\nCleaning up temporary files...`);
    if (fs.existsSync(TMP_DIR)) {
      runCommand(`rm -rf "${TMP_DIR}"`);
    }
  }

  console.log('\nAll skills successfully configured locally!');
}

setup();
