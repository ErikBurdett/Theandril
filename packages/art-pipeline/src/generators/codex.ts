import { readArtFile } from '../toolchain/process';
import { storeCandidate, validateRequest } from './shared';
import type { ArtGenerationRequest, ArtGenerator, GeneratedCandidate, ProviderCapabilities } from './types';

/** Bridge for a real tool-produced local file, not a pretend Node image-generation API. */
export async function importCodexCandidate(sourcePath: string, metadata: Omit<ArtGenerationRequest, 'outputDirectory'> & { model?: string; licenseNotes: string[] }, outputDirectory: string): Promise<GeneratedCandidate> {
  const { model, licenseNotes, ...request } = metadata;
  if (!licenseNotes.length || licenseNotes.some(note => !note.trim() || note.length > 2000)) throw new Error('Document source provenance/license notes before importing a generated candidate.');
  const checked = await validateRequest({ ...request, outputDirectory });
  return storeCandidate(checked, 'codex-built-in', [await readArtFile(sourcePath)], { model, seed: request.seed, licenseNotes: [...licenseNotes, 'Imported from an actual Codex built-in image-generation output. This CLI does not itself invoke that session tool.'] });
}
export class CodexSourceGenerator implements ArtGenerator {
  readonly id = 'codex-built-in';
  capabilities(): ProviderCapabilities { return { autonomous: false, references: true, seeded: false, animation: false, maxWidth: 8192, maxHeight: 8192, limitations: ['Generation runs through the actual Codex session tool; import its saved PNG with importCodexCandidate. Seed/model reproducibility is not asserted.'] }; }
  async generate(_request: ArtGenerationRequest): Promise<GeneratedCandidate[]> { throw new Error('Use the actual Codex image-generation tool, then import its source file. No built-in generation API is available to this CLI process.'); }
}
