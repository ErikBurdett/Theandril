"""Compose exact processed candidate review sheets; never approve or alter art."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
from build import review_sheet


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('role'); parser.add_argument('--factory-root', required=True)
    args = parser.parse_args(); sys.path.insert(0, args.factory_root)
    from factory.png import read_png, write_png, enlarge
    root = Path(__file__).resolve().parents[4]
    asset_id = 'battle.unit.' + args.role
    candidate = root / 'assets/art/candidates' / (asset_id + '.json')
    manifest = json.loads(candidate.read_text())
    report = json.loads((root / 'assets/art/reports' / (asset_id + '.json')).read_text())
    output = root / 'docs/art/reviews/battle-units' / (args.role + '-v' + str(manifest['version']))
    output.mkdir(parents=True, exist_ok=True)
    frames = manifest['frames']; images = [read_png(root / frame['sourcePath']) for frame in frames]
    review_sheet(output, images, frames, write_png, enlarge)
    groups = list(dict.fromkeys((frame['direction'], frame['state']) for frame in frames))
    size = images[0][0]; width, height = (size + 8) * 8 + 8, (size + 8) * len(groups) + 8
    pixels = bytearray(bytes((34, 44, 52, 255)) * width * height)
    for row, (direction, state) in enumerate(groups):
        selected = [(image, frame) for image, frame in zip(images, frames) if frame['direction'] == direction and frame['state'] == state]
        for column, ((_, _, rgba), _) in enumerate(selected):
            for y in range(size):
                for x in range(size):
                    at = (y * size + x) * 4
                    if rgba[at + 3]:
                        dest = ((row * (size + 8) + y + 8) * width + column * (size + 8) + x + 8) * 4
                        pixels[dest:dest + 4] = rgba[at:at + 4]
    write_png(output / 'all-clips-1x.png', width, height, pixels)
    enlarge(output / 'all-clips-1x.png', output / 'all-clips-4x.png', 4)
    evidence = {'assetId': asset_id, 'candidateInputHash': report['inputHash'], 'candidateManifestSha256': hashlib.sha256(candidate.read_bytes()).hexdigest(),
                'rows': [{'direction': direction, 'state': state} for direction, state in groups], 'scope': 'Exact processed native and nearest 4x pixels; no visual approval or runtime acceptance implied.',
                'files': [{'path': str(path.relative_to(root)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in sorted(output.glob('*.png'))]}
    (output / 'evidence.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(asset_id, report['inputHash'], str(output.relative_to(root)))


if __name__ == '__main__': main()
