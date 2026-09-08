from battle_authoring import material, mesh, key


def build(ctx):
    for name, color in [('shadow', '#396574'), ('blue', '#659093'), ('silver', '#9fb5b9'), ('pale', '#d2ddcf')]:
        material(ctx, name, color, luminous=True)
    # Four individually keyed brackets close into a sheltering pointed arch.
    shapes = [([(-15, -5), (-15, 8), (-8, 15), (-7, 13), (-12, 7), (-12, -4)], 'blue'),
              ([(15, -5), (15, 8), (8, 15), (7, 13), (12, 7), (12, -4)], 'silver'),
              ([(-15, -5), (-2, -16), (-2, -12), (-12, -3)], 'shadow'),
              ([(15, -5), (2, -16), (2, -12), (12, -3)], 'blue')]
    for index, (points, color) in enumerate(shapes):
        obj = mesh(ctx, f'closing ward bracket {index}', points, color, .005 * index)
        for frame, scale in enumerate([.15, .4, .73, 1, .94, .83, .63, .28], 1):
            split = max(0, frame - 5) * .8
            key(obj, frame, x=(-1 if index % 2 == 0 else 1) * split, y=split,
                scale=scale if frame < 8 or index < 2 else 0)
    seam = mesh(ctx, 'ward binding light', [(0, 9), (3, 3), (1, 1), (1, -5), (-1, -5), (-1, 1), (-3, 3)], 'pale', -.03)
    for frame, scale in enumerate([0, .4, .8, 1, .86, .7, .4, .15], 1):
        key(seam, frame, scale=scale)
    return {'title': 'Boundward: closing brackets and pale binding', 'limitations': ['Cool protective cue; no invisible wall, movement blocker or new magic rule.', 'One-shot contracts and clears, rather than looping a permanent shield.']}
