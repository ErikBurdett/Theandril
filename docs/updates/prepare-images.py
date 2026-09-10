"""Reproduce journal crops from retained owned pixels, without providers.
Run from the repository root with Pillow installed. No sibling writes.
"""
from pathlib import Path
from hashlib import sha256
import json
from PIL import Image, __version__

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'apps/web/public'
OUT = PUBLIC / 'updates'
SOURCES = [
    ('campaign', 'docs/development/ui-review-current/production-artifacts/deployment-assets-built-ga-48619--configured-deployment-base/deployment-new-campaign.png', (465, 215, 985, 675),
     'Explored forest, highland and coastal hexes at the start of a Theandril campaign.',
     'Built-game new-campaign smoke fixture, cropped to the explored map. Illustrative context, not the turn-236 save or an R17 battle.'),
    ('battle', 'docs/development/ui-review-current/production-artifacts/battlefield-built-battlefi-7a66d-s-without-development-hooks/production-battlefield.png', (580, 325, 850, 490),
     'Two opposing formations of individual soldiers, with banners and strength labels, on Theandril’s tactical field.',
     'Retained built-production battlefield regression fixture, cropped to its soldiers. Shows the actual renderer; not an organic campaign battle or proof of the R17 reserve fix.'),
    ('cultures', 'docs/screenshots/slice22-factions/culture-cohort-4-stage-3-near.png', (530, 230, 1430, 555),
     'Three distinctly built cultural cities arranged on a textured hex map in Theandril’s authored art-review gallery.',
     'Slice-22 cultural city gallery, an authored in-game review fixture cropped to its city silhouettes. Illustrative, not an organic campaign cityscape.'),
    ('archipelago', 'docs/screenshots/slice20-huge-archipelago-final.png', (12, 113, 878, 675),
     'A generated archipelago of pale coasts and scattered islands shown in the game’s world overview.',
     'Slice-20 generated-world overview regression fixture, cropped to the islands. Illustrative geography, not the retained Standard/24 Long archive campaign.'),
]

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

OUT.mkdir(parents=True, exist_ok=True)
assets = []
for id_, source, crop, alt, caption in SOURCES:
    original = Image.open(ROOT / source).convert('RGB')
    image = original.crop(crop) if crop else original
    output = OUT / f'{id_}.webp'
    image.save(output, 'WEBP', lossless=True, method=6, exact=True)
    assets.append(dict(id=id_, path=f'updates/{id_}.webp', sourceRepository='ErikBurdett/Theandril',
        sourceRevision='8b3b8c148b7e8ee3689001210033fee7a1b8a6ef', sourcePath=source,
        sourceSha256=digest(ROOT / source), sourceWidth=original.width, sourceHeight=original.height,
        crop=list(crop) if crop else None, resize=None, encoding=f'Pillow {__version__}, WebP lossless, method=6; RGB',
        sha256=digest(output), bytes=output.stat().st_size, width=image.width, height=image.height, alt=alt, caption=caption))

materials = []
for id_ in ['wood', 'parchment', 'ornament.corner-idle']:
    path = f'ui/hearth-card/{id_}.webp'
    image = Image.open(PUBLIC / path)
    materials.append(dict(id=id_, path=path, sourcePath=f'apps/web/public/{path}',
        sourceRepository='ErikBurdett/Theandril', sha256=digest(PUBLIC / path),
        width=image.width, height=image.height, transform='None; reuse existing reviewed Hearth & Card derivative by URL. No duplicate texture.',
        alt='', caption='Decorative interface material, not a depiction of canonical gameplay.'))
manifest = dict(schemaVersion=1, licenseNotes='Original owned Theandril gameplay screenshots and previously reviewed Hearth & Card interface artwork. Original provider/service terms apply; no new generation or provider call. No third-party game artwork, font CDN, terminal image, or campaign trace is shipped.',
    review='Inspected original source pixels before selecting these crops; derivative review findings retained in docs/development/dispatches/frontend-evidence/REPORT.md.', assets=assets, sharedMaterials=materials,
    totalJournalImageBytes=sum(asset['bytes'] for asset in assets))
payload = json.dumps(manifest, indent=2) + '\n'
(OUT / 'provenance.json').write_text(payload)
(ROOT / 'apps/web/src/updates/media.json').write_text(payload)
print(json.dumps({'images': [{'id': a['id'], 'dimensions': [a['width'], a['height']], 'bytes': a['bytes']} for a in assets], 'totalJournalImageBytes': manifest['totalJournalImageBytes']}, indent=2))
