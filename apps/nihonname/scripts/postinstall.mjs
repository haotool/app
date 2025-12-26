/**
 * Postinstall script to create .bin symlinks
 * Fixes pnpm monorepo issue where .bin directory is not created
 */
import { mkdirSync, symlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binDir = join(__dirname, '..', 'node_modules', '.bin');
const pnpmBinDir = join(__dirname, '..', '..', '..', 'node_modules', '.pnpm', 'node_modules', '.bin');

// Create .bin directory
mkdirSync(binDir, { recursive: true });

// List of commands to link
const commands = ['vite', 'vite-react-ssg', 'vitest'];

commands.forEach(cmd => {
  const linkPath = join(binDir, cmd);
  const targetPath = join('..', '..', '..', '..', 'node_modules', '.pnpm', 'node_modules', '.bin', cmd);
  
  try {
    if (!existsSync(linkPath)) {
      symlinkSync(targetPath, linkPath);
      console.log(`✓ Linked ${cmd}`);
    }
  } catch (err) {
    // Silently ignore if already exists or fails
  }
});
