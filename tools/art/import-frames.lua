-- Trusted repository script. Paths and frame metadata arrive as JSON, never Lua code.
local file = assert(io.open(app.params.manifest, "r"), "Cannot open frame manifest")
local manifest = json.decode(file:read("*a"))
file:close()
assert(#manifest.frames >= 1 and #manifest.frames <= 256, "Invalid frame count")
local sprite = Sprite(manifest.width, manifest.height, ColorMode.RGB)
local layer = sprite.layers[1]
layer.name = "Artwork"
for index, entry in ipairs(manifest.frames) do
  local image = Image{fromFile=entry.path}
  assert(image.width == manifest.width and image.height == manifest.height, "Frame dimensions disagree")
  if index > 1 then sprite:newEmptyFrame() end
  sprite.frames[index].duration = entry.durationMs / 1000
  sprite:newCel(layer, sprite.frames[index], image, Point(0, 0))
end
for _, entry in ipairs(manifest.tags) do
  local tag = sprite:newTag(entry.from + 1, entry.to + 1)
  tag.name = entry.name
  tag.aniDir = AniDir.FORWARD
end
sprite:saveAs(manifest.outputPath)
sprite:close()
