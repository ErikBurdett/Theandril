from battle_authoring import material, mesh, key, fragment


def build(ctx):
    for name, color in [('coal', '#642f26'), ('flame', '#a14c27'), ('orange', '#d67e35'), ('gold', '#f2bc60'), ('heart', '#efe2b0')]:
        material(ctx, name, color, luminous=True)
    flames = [
        ('left curled tongue', [(-2, -10), (-8, -3), (-7, 5), (-13, 12), (-8, 11), (-2, 5), (1, -5)], 'flame', .01),
        ('right curled tongue', [(0, -10), (7, -3), (7, 7), (13, 15), (11, 5), (4, -8)], 'orange', 0),
        ('central lifted coal', [(-4, -10), (-4, -3), (0, 4), (-1, 14), (4, 8), (5, 0), (3, -10)], 'gold', -.02),
        ('pale heat slit', [(-1, -8), (-1, -2), (1, 4), (2, -2), (1, -7)], 'heart', -.04),
    ]
    for index, (name, points, color, depth) in enumerate(flames):
        obj = mesh(ctx, name, points, color, depth)
        for frame, scale in enumerate([.17, .45, .8, 1, .75, .36, 0, 0], 1):
            key(obj, frame, x=(index - 1) * max(0, frame - 4) * 1.7, y=max(0, frame - 3), scale=scale,
                angle=(index - 1) * max(0, frame - 2) * .035)
    for i, (point, born, size) in enumerate([((-13, 18), 3, .9), ((12, 19), 3, .95), ((-6, 13), 4, .8), ((8, 12), 5, .8)]):
        fragment(ctx, f'released ember {i}', point, 'orange' if i % 2 else 'gold', born, size, tail=i < 2)
    return {'title': 'Cinderthread ember release', 'limitations': ['Presentation for a real Flame spell, not a new tradition or area-damage rule.', 'Hard-edge luminous ramps; no bloom or translucent smoke.']}
