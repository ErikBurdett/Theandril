# Asset Manifest Schema

Suggested canonical record:

```ts
interface ArtAssetManifest {
  id: string;
  type:
    | "unit"
    | "monster"
    | "terrain"
    | "settlement"
    | "map-object"
    | "effect"
    | "ui"
    | "portrait";

  status:
    | "MISSING"
    | "BRIEF_READY"
    | "CANDIDATE"
    | "REJECTED"
    | "VALIDATED"
    | "APPROVED"
    | "ATLASED"
    | "INTEGRATED"
    | "NEEDS_REVISION";

  version: number;

  nativeResolution: {
    width: number;
    height: number;
  };

  paletteId: string;

  generator?: {
    provider: string;
    model?: string;
    seed?: string;
    promptHash?: string;
    referenceHashes?: string[];
  };

  processing: {
    pixelSnapper?: {
      version: string;
      pixelSize?: number;
      colorCount?: number;
      paletteHash?: string;
    };
    aseprite?: {
      version: string;
      profile: string;
    };
  };

  animation?: {
    directions: number;
    pivot: [number, number];
    states: Record<string, {
      frames: number;
      fps: number;
      loop: boolean;
    }>;
  };

  validation: {
    score: number;
    passed: boolean;
    reportPath: string;
  };

  provenance: {
    createdAt: string;
    sourceRefs: string[];
    licenseNotes: string[];
  };

  runtime?: {
    atlasId: string;
    framePrefix: string;
  };
}
```

Use Zod or equivalent to validate.
