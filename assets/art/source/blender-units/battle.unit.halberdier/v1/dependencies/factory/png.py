"""Small dependency-free RGBA8 PNG reader/writer and exact-palette reduction."""
import struct
import zlib

SIGNATURE = b'\x89PNG\r\n\x1a\n'


def write_png(path, width, height, pixels):
    if len(pixels) != width * height * 4:
        raise ValueError('RGBA byte count does not match image dimensions')
    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xffffffff)
    scanlines = b''.join(b'\0' + bytes(pixels[y * width * 4:(y + 1) * width * 4]) for y in range(height))
    data = SIGNATURE + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress(scanlines, 9)) + chunk(b'IEND', b'')
    path.write_bytes(data)


def read_png(path):
    data = path if isinstance(path, bytes) else path.read_bytes()
    if data[:8] != SIGNATURE:
        raise ValueError(f'Invalid PNG signature: {path}')
    offset, payload, width, height, color, depth, interlace = 8, bytearray(), None, None, None, None, None
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError('Truncated PNG chunk')
        length = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        body = data[offset + 8:offset + 8 + length]
        crc_offset = offset + 8 + length
        if crc_offset + 4 > len(data) or zlib.crc32(kind + body) & 0xffffffff != struct.unpack_from('>I', data, crc_offset)[0]:
            raise ValueError('Invalid PNG chunk checksum')
        if kind == b'IHDR':
            width, height, depth, color, _, _, interlace = struct.unpack('>IIBBBBB', body)
        elif kind == b'IDAT':
            payload.extend(body)
        elif kind == b'IEND':
            break
        offset += length + 12
    if depth != 8 or color not in (2, 6) or interlace != 0:
        raise ValueError('Only non-interlaced RGB8 and RGBA8 PNG images are supported')
    channels = 4 if color == 6 else 3
    stride = width * channels
    raw = zlib.decompress(payload)
    if len(raw) != (stride + 1) * height:
        raise ValueError('PNG scanline length mismatch')
    rows, previous = bytearray(), bytearray(stride)
    for y in range(height):
        start = y * (stride + 1)
        mode = raw[start]
        row = bytearray(raw[start + 1:start + 1 + stride])
        for x in range(stride):
            left = row[x - channels] if x >= channels else 0
            up = previous[x]
            upper_left = previous[x - channels] if x >= channels else 0
            if mode == 1:
                predictor = left
            elif mode == 2:
                predictor = up
            elif mode == 3:
                predictor = (left + up) // 2
            elif mode == 4:
                p = left + up - upper_left
                distances = (abs(p - left), abs(p - up), abs(p - upper_left))
                predictor = (left, up, upper_left)[distances.index(min(distances))]
            elif mode == 0:
                predictor = 0
            else:
                raise ValueError('Unsupported PNG row filter')
            row[x] = (row[x] + predictor) & 255
        if channels == 4:
            rows.extend(row)
        else:
            for x in range(0, stride, 3):
                rows.extend(row[x:x + 3]); rows.append(255)
        previous = row
    return width, height, bytes(rows)


def palette_rgb(colors):
    return [tuple(bytes.fromhex(color.removeprefix('#')[:6])) for color in colors]


def quantize(source, target, size, colors, alpha_threshold=.5):
    width, height, pixels = read_png(source)
    output_width, output_height = size
    palette = palette_rgb(colors)
    if not palette:
        raise ValueError('A non-empty master palette is required for pixel output')
    result, cache = bytearray(), {}
    for y in range(output_height):
        sy = min(height - 1, int((y + .5) * height / output_height))
        for x in range(output_width):
            sx = min(width - 1, int((x + .5) * width / output_width))
            at = (sy * width + sx) * 4
            color = tuple(pixels[at:at + 3])
            if pixels[at + 3] < alpha_threshold * 255:
                result.extend((0, 0, 0, 0)); continue
            if color not in cache:
                cache[color] = min(palette, key=lambda p: 2 * (p[0] - color[0]) ** 2 + 4 * (p[1] - color[1]) ** 2 + 3 * (p[2] - color[2]) ** 2)
            result.extend((*cache[color], 255))
    write_png(target, output_width, output_height, result)


def enlarge(source, target, scale):
    width, height, pixels = read_png(source)
    if not isinstance(scale, int) or scale < 1:
        raise ValueError('Preview scale must be a positive integer')
    result = bytearray()
    for y in range(height):
        row = b''.join(pixels[(y * width + x) * 4:(y * width + x + 1) * 4] * scale for x in range(width))
        for _ in range(scale): result.extend(row)
    write_png(target, width * scale, height * scale, result)


def sheet(paths, target, columns=4, padding=12):
    images = [read_png(path) for path in paths]
    if not images:
        raise ValueError('No images available for review sheet')
    tile_w = max(image[0] for image in images); tile_h = max(image[1] for image in images)
    width = columns * (tile_w + padding) + padding
    height = ((len(images) + columns - 1) // columns) * (tile_h + padding) + padding
    pixels = bytearray(bytes((17, 20, 27, 255)) * width * height)
    for index, (w, h, source) in enumerate(images):
        ox = padding + index % columns * (tile_w + padding) + (tile_w - w) // 2
        oy = padding + index // columns * (tile_h + padding) + (tile_h - h) // 2
        for y in range(h):
            for x in range(w):
                s = (y * w + x) * 4; d = ((oy + y) * width + ox + x) * 4
                a = source[s + 3] / 255
                for c in range(3): pixels[d + c] = round(source[s + c] * a + pixels[d + c] * (1 - a))
    write_png(target, width, height, pixels)
