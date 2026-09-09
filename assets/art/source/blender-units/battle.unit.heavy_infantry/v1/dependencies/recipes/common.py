"""Original authored primitive and PBR helpers shared by portable recipes."""
import hashlib
import math
import random
from pathlib import Path
import bpy
from mathutils import Vector
from factory.png import write_png, palette_rgb


class Context:
    def __init__(self, profile, source):
        self.profile = profile
        self.source = Path(source)
        self.pixel = profile['workflow'] in ('pixel_2d', 'pixel_3d')
        self.materials = {}
        self.filtering = profile.get('textures', {}).get('filter', 'nearest' if self.pixel else 'linear')
        self.texture_size = int(profile.get('textures', {}).get('size', 128))
        self.palette = palette_rgb(profile.get('palette', {}).get('colors', []))
        (self.source / 'textures').mkdir(parents=True, exist_ok=True)

    def material(self, name, hex_color, metal=0, rough=.75, emission=0, fabric=False):
        base = tuple(bytes.fromhex(hex_color.lstrip('#')))
        size = self.texture_size
        rng = random.Random(int(hashlib.sha256(name.encode()).hexdigest()[:8], 16))
        pixels, normals = bytearray(), bytearray()
        for y in range(size):
            for x in range(size):
                nx, ny = x / size, y / size
                broad = math.sin(nx * 21 + math.sin(ny * 13) * 2) * math.cos(ny * 19 - nx * 7)
                grain = (rng.random() - .5) * (.12 if self.pixel else .20)
                variation = .90 + broad * .11 + grain
                if fabric: variation += .07 * (1 if (x + y) % 3 else -1)
                col = tuple(max(0, min(255, round(c * variation))) for c in base)
                if self.pixel:
                    col = min(self.palette, key=lambda p: sum((p[i] - col[i]) ** 2 for i in range(3)))
                elif metal > .4 and broad < -.53:
                    col = tuple(round(col[i] * (.70, .86, .9)[i]) for i in range(3))
                pixels.extend((*col, 255))
                # Small-scale original tangent-space texture grain, not a sculpt bake.
                dx = math.cos(nx * 73 + ny * 21) * .055 + grain * .16
                dy = math.sin(ny * 69 - nx * 31) * .055 + grain * .16
                length = math.sqrt(dx * dx + dy * dy + 1)
                normals.extend((round((dx / length * .5 + .5) * 255), round((dy / length * .5 + .5) * 255), round((1 / length * .5 + .5) * 255), 255))
        path = self.source / 'textures' / (name + '-basecolor.png')
        write_png(path, size, size, pixels)
        mat = bpy.data.materials.new(name)
        mat.diffuse_color = tuple(c / 255 for c in base) + (1,)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes; links = mat.node_tree.links
        shader = nodes.get('Principled BSDF')
        shader.inputs['Metallic'].default_value = metal
        shader.inputs['Roughness'].default_value = rough
        image = bpy.data.images.load(str(path), check_existing=True); image.pack()
        tex = nodes.new('ShaderNodeTexImage'); tex.image = image
        tex.interpolation = 'Closest' if self.filtering == 'nearest' else 'Linear'
        links.new(tex.outputs['Color'], shader.inputs['Base Color'])
        if emission:
            links.new(tex.outputs['Color'], shader.inputs['Emission Color'])
            shader.inputs['Emission Strength'].default_value = emission
        if not self.pixel and not emission:
            normal_path = self.source / 'textures' / (name + '-normal.png')
            write_png(normal_path, size, size, normals)
            normal_image = bpy.data.images.load(str(normal_path), check_existing=True)
            normal_image.colorspace_settings.name = 'Non-Color'; normal_image.pack()
            normal_tex = nodes.new('ShaderNodeTexImage'); normal_tex.image = normal_image
            normal_tex.interpolation = 'Closest' if self.filtering == 'nearest' else 'Linear'
            normal_map = nodes.new('ShaderNodeNormalMap'); normal_map.inputs['Strength'].default_value = .45
            links.new(normal_tex.outputs['Color'], normal_map.inputs['Color'])
            links.new(normal_map.outputs['Normal'], shader.inputs['Normal'])
        self.materials[name] = mat
        return mat

    def assign(self, obj, material, name):
        obj.name = name
        obj.data.materials.append(self.materials[material])
        if not obj.data.uv_layers:
            uv = obj.data.uv_layers.new(name='UVMap')
            for poly in obj.data.polygons:
                major = max(range(3), key=lambda i: abs(poly.normal[i]))
                axes = [i for i in range(3) if i != major]
                for loop in poly.loop_indices:
                    co = obj.data.vertices[obj.data.loops[loop].vertex_index].co
                    uv.data[loop].uv = (co[axes[0]] * .5 + .5, co[axes[1]] * .5 + .5)
        return obj

    def box(self, name, loc, dimensions, material='stone', bevel=.025, rotation=None):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        obj = bpy.context.object; obj.dimensions = dimensions
        if rotation: obj.rotation_euler = rotation
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            mod = obj.modifiers.new('Worn manufactured edge', 'BEVEL')
            mod.width = min(bevel, min(dimensions) * .24); mod.segments = 1 if self.pixel else 3
            bpy.ops.object.modifier_apply(modifier=mod.name)
            weighted = obj.modifiers.new('Surface normals', 'WEIGHTED_NORMAL')
            bpy.ops.object.modifier_apply(modifier=weighted.name)
        return self.assign(obj, material, name)

    def cylinder(self, name, loc, radius, depth, material='bronze', vertices=None, axis='Z'):
        rotation = {'X': (0, math.pi / 2, 0), 'Y': (math.pi / 2, 0, 0), 'Z': (0, 0, 0)}[axis]
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices or (12 if self.pixel else 24), radius=radius, depth=depth, location=loc, rotation=rotation)
        obj = bpy.context.object
        if not self.pixel:
            mod = obj.modifiers.new('Rim bevel', 'BEVEL'); mod.width = min(.012, radius * .07); mod.segments = 2
            bpy.ops.object.modifier_apply(modifier=mod.name)
        for poly in obj.data.polygons: poly.use_smooth = len(poly.vertices) == 4
        return self.assign(obj, material, name)

    def beam(self, name, start, end, radius=.035, material='bronze', vertices=8):
        start, end = Vector(start), Vector(end); vector = end - start
        obj = self.cylinder(name, (start + end) / 2, radius, vector.length, material, vertices)
        obj.rotation_euler = vector.to_track_quat('Z', 'Y').to_euler()
        return obj

    def sphere(self, name, loc, scale, material='jewel', smooth=True):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12 if self.pixel else 20, ring_count=8 if self.pixel else 12, radius=1, location=loc)
        obj = bpy.context.object; obj.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        for poly in obj.data.polygons: poly.use_smooth = smooth
        return self.assign(obj, material, name)

    def mesh(self, name, vertices, faces, material='stone', smooth=False):
        data = bpy.data.meshes.new(name); data.from_pydata(vertices, [], faces); data.update()
        obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
        for poly in data.polygons: poly.use_smooth = smooth
        return self.assign(obj, material, name)

    def ring(self, name, loc, radius=.05, tube=.008, material='bronze', rotation=(0, 0, 0)):
        bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=tube, major_segments=12 if self.pixel else 20, minor_segments=4 if self.pixel else 6, location=loc, rotation=rotation)
        return self.assign(bpy.context.object, material, name)

    def part(self, name, location=(0, 0, 0), parent=None):
        """Create a named empty pivot. location is local when parent is supplied."""
        if not isinstance(name, str) or not name.strip(): raise ValueError('Part names must be non-empty strings')
        if bpy.data.objects.get(name) is not None: raise ValueError('Duplicate semantic part name: ' + name)
        obj = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(obj)
        obj.parent = parent; obj.location = location; obj['factory_part'] = name
        return obj

    def parent(self, obj, pivot, keep_world=True):
        """Parent a node, preserving its world transform unless explicitly disabled."""
        bpy.context.view_layer.update()
        world = obj.matrix_world.copy()
        obj.parent = pivot
        if keep_world: obj.matrix_world = world
        return obj

    def mark_part(self, obj, name=None):
        """Retain a leaf mesh and its origin as a semantic runtime attachment."""
        name = name or obj.name
        if not isinstance(name, str) or not name.strip(): raise ValueError('Part names must be non-empty strings')
        existing = bpy.data.objects.get(name)
        if existing is not None and existing != obj: raise ValueError('Duplicate semantic part name: ' + name)
        obj.name = name; obj['factory_part'] = name
        return obj

    def merge(self):
        """Batch anonymous leaves per parent/material; never cross a pivot hierarchy.

        Empty groups, meshes with children, and deforming/modifier-bearing meshes
        retain identity. With preserveNamedParts enabled, factory_part tags and
        quality.requireNamedParts additionally preserve explicitly named leaves.
        Descriptive primitive names alone are not a runtime identity contract.
        """
        preserve = self.profile.get('export', {}).get('preserveNamedParts', True)
        required = set(self.profile.get('quality', {}).get('requireNamedParts', []))
        objects = list(bpy.context.scene.objects)
        names = set()
        for obj in objects:
            semantic = obj.get('factory_part') if preserve else None
            if semantic is not None:
                if not isinstance(semantic, str) or not semantic.strip(): raise ValueError('factory_part must be a non-empty stable name')
                existing = bpy.data.objects.get(semantic)
                if existing is not None and existing != obj: raise ValueError('Duplicate semantic part name: ' + semantic)
                obj.name = semantic
            names.add(obj.name)
        missing = required - names
        if missing: raise ValueError('Required named parts missing from recipe: ' + ', '.join(sorted(missing)))
        groups = {}
        for obj in objects:
            if obj.type != 'MESH': continue
            explicit = preserve and (obj.get('factory_part') is not None or obj.name in required)
            structural = bool(obj.children or obj.modifiers or obj.vertex_groups)
            if explicit or structural or len(obj.data.materials) != 1: continue
            key = (obj.parent, obj.data.materials[0].name)
            groups.setdefault(key, []).append(obj)
        for (parent, material), meshes in groups.items():
            bpy.ops.object.select_all(action='DESELECT')
            for obj in meshes: obj.select_set(True)
            active = meshes[0]; world = active.matrix_world.copy()
            bpy.context.view_layer.objects.active = active
            if len(meshes) > 1: bpy.ops.object.join()
            active = bpy.context.object; active.parent = parent; active.matrix_world = world
            active.name = 'surface_' + material
        bpy.context.view_layer.update()
