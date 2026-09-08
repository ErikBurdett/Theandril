from battle_authoring import material, mesh, key, fragment


def build(ctx):
    for name, color in [('wood', '#88765a'), ('shaft', '#b7a07a'), ('iron', '#a1afb1'), ('linen', '#e1cf9f'), ('dark', '#49312b')]:
        material(ctx, name, color, luminous=True)
    shaft = mesh(ctx, 'moving arrow shaft', [(-16, -.6), (-3, -.6), (-3, .6), (-16, .6)], 'shaft')
    head = mesh(ctx, 'separate steel arrow point', [(-5, -2), (0, 0), (-5, 2), (-3.8, 0)], 'iron', -.01)
    feather = mesh(ctx, 'linen fletching', [(-17, -2.5), (-12, -.4), (-14, 1.8), (-18, 2.2)], 'linen', -.02)
    for index, (x, y, scale) in enumerate([(-7, 4, 1), (-3, 1, 1), (0, 0, 1), (1, 0, .6), (0, 0, 0), (0, 0, 0), (0, 0, 0), (0, 0, 0)], 1):
        for obj in (shaft, head, feather):
            key(obj, index, x, y, scale, .12)
    burst = mesh(ctx, 'brief blunt impact dust', [(-5, 0), (-2, 3), (0, 2), (3, 5), (3, 1), (6, 0), (2, -2), (0, -5), (-2, -2)], 'wood', .02)
    for frame, scale in enumerate([0, 0, .4, 1, .72, .27, 0, 0], 1):
        key(burst, frame, scale=scale)
    for i, (point, color, born, size) in enumerate([((14, 12), 'shaft', 3, 1), ((-7, -14), 'wood', 3, 1.05),
            ((9, -9), 'dark', 4, .95), ((-11, 10), 'linen', 4, .8)]):
        fragment(ctx, f'broken arrow fragment {i}', point, color, born, size, tail=i < 2)
    return {'title': 'Shaft strike and wood-splinter decay', 'limitations': ['No firearms, blood or ballistic game rules.', 'One-shot impact uses an incoming arrow, not a stationary projectile icon.']}
