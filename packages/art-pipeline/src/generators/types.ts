export interface ArtGenerationRequest {
  assetId: string; prompt: string; width: number; height: number; seed?: string;
  references?: { path: string; sha256: string }[]; outputDirectory: string;
}
export interface ProviderCapabilities {
  autonomous: boolean; references: boolean; seeded: boolean; animation: boolean;
  maxWidth: number; maxHeight: number; limitations: string[];
}
export interface GeneratedCandidate {
  assetId: string; provider: string; model?: string; seed?: string; promptHash: string; referenceHashes: string[];
  files: { path: string; sha256: string }[]; createdAt: string; licenseNotes: string[];
}
export interface ArtGenerator { id: string; capabilities(): ProviderCapabilities; generate(request: ArtGenerationRequest): Promise<GeneratedCandidate[]> }
