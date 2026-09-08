from battle_authoring import material, mesh, key


def build(ctx):
    for name, color in [('bronze', '#977544'), ('gold', '#ccb36b'), ('light', '#efe2b0')]:
        material(ctx, name, color, luminous=True)
    for index, (width, color) in enumerate([(11, 'bronze'), (9, 'gold'), (6, 'light')]):
        obj = mesh(ctx, f'rising resolve stroke {index}', [(-width, -3), (-width, 0), (0, 5), (width, 0), (width, -3), (0, 2)], color, -.015 * index)
        for frame in range(1, 9):
            age = frame - index
            scale = [0, .28, .55, .9, 1, .82, .63, .40, .28][max(0, min(8, age))]
            key(obj, frame, y=-10 + index * 6 + max(0, age - 2) * 2, scale=scale if age > 0 else 0)
    core = mesh(ctx, 'resolve opening seed', [(0, 3), (2, 0), (0, -3), (-2, 0)], 'light', -.06)
    for frame, scale in enumerate([.7, 1, .7, .4, 0, 0, 0, 0], 1):
        key(core, frame, y=-10, scale=scale)
    return {'title': 'Rally: three measured rising strokes', 'limitations': ['Shared officer cue, not a faction crest or a floating text substitute.', 'Playback never applies morale or grants a new ability.']}
