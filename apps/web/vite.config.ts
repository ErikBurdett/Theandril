import { readdir, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Vite copies public files outside Rollup's asset graph. Strip lab-only output after that copy. */
function omitDevelopmentArt(): Plugin {
  let outputArt = '';
  const strip = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(error => { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; });
    for (const entry of entries) {
      const path = join(directory, entry.name);
      // Do not follow symlinks or touch any source/public directory.
      if (entry.isDirectory()) await strip(path);
      else if (entry.isFile() && (entry.name === 'lab-catalog.json' || /^preview-[a-zA-Z0-9._-]+\.png$/.test(entry.name))) await unlink(path);
    }
  };
  return {
    name: 'theandril-omit-development-art', apply: 'build',
    configResolved(config) {
      outputArt = resolve(config.root, config.build.outDir, 'art');
      if (outputArt === resolve(config.publicDir, 'art') || outputArt === resolve(config.root, 'art')) throw new Error('Refusing to strip development art from a source directory.');
    },
    async writeBundle() { await strip(outputArt); },
  };
}

export default defineConfig({
  plugins: [omitDevelopmentArt()],
  // These dependencies are reached through the simulation worker only after a
  // campaign starts. Discovering them then invalidates the browser dependency
  // hash and reloads the page, losing an unsaved campaign on a cold dev server.
  // pnpm keeps these under their owning workspace packages, so resolve the
  // nested imports explicitly instead of depending on accidental hoisting.
  optimizeDeps: { include: ['@theandril/content > zod', '@theandril/persistence > dexie', '@theandril/persistence > fflate'] },
});
