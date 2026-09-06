# Asset Manifest Schema

## Implemented schema

The suggested sketch below is preserved from the supplied pack. The actual strict, versioned contract is [packages/art-pipeline/src/schema.ts](packages/art-pipeline/src/schema.ts), with a separate browser-only [runtime catalog schema](packages/art-pipeline/src/runtime.ts). It makes frames (stable IDs, facing/state/index, duration, pivot, source path), processing-step hashes, constraints and exact-input review evidence explicit. Provider/model/source metadata is under `provenance`, processing is an ordered array, and `validation`/`review` are nullable before review. See a [retained guard approval](assets/art/approved/unit.guard.json) and the [operator guide](docs/art/README.md). Do not produce the illustrative interface below verbatim and assume it passes the implementation.

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
