import { Application, Container, Graphics, Sprite, Text } from 'pixi.js';
import type { Observation } from '@theandril/sim';
import { BIOME_ART_IDS, RuntimeArt, type ArtStatus } from './art';
import { terrainRelief } from './terrain-style';
import { selectEntityArt } from './faction-style';
export type { ArtStatus } from './art';

const RADIUS = 29;
const HEX_WIDTH = Math.sqrt(3) * RADIUS;
const ROW_HEIGHT = RADIUS * 1.5;
const CHUNK = 16;
const TERRAIN_COLORS = [0x25404b, 0x747658, 0x3f5a49, 0x877963, 0x777a76];
// Indexed by the map generator's stable biome IDs; these are visual colors only.
const BIOME_COLORS = [0x25404b, 0x747658, 0x3f5a49, 0x496668, 0x8d9993, 0xa28b62, 0x8b8760, 0x526e66, 0x345d45, 0x92958e];
type Cell = Observation['cells'][number];
export interface MapPointerInput { shiftKey: boolean; pointerType: string }
export interface RouteVisual { origin: number; path: number[]; waypoints?: number[]; paused?: boolean; attack?: boolean }
type Marker = { id: string; cell: number; name: string; factionId: string; settlement: boolean; ruin?: boolean; unitId?: string; population?: number };
type ChunkView = { root: Container; count: number; version: number; used: number; sprites: Sprite[]; artCells: number };

export interface RenderMetrics {
  renderer: 'webgl'; frameCount: number; frameMs: number; frameP95Ms: number;
  renderCpuMs: number; visibleCells: number; visibleChunks: number;
  cachedChunks: number; chunkRebuilds: number; visibleEntities: number; zoom: number;
  highlightedCells: number; routeCells: number; previewCells: number;
  atlasPages: number; residentAtlasBytesEstimate: number; artLoadMs: number; artFirstRenderCpuMs: number;
  visibleSprites: number; terrainSpriteCells: number; pooledSprites: number;
}

/** Only explored cells enter this view. Viewport work is bounded by visible chunks. */
export class WorldRenderer {
  private app = new Application();
  private world = new Container({ eventMode: 'none' });
  private terrain = new Container();
  private figures = new Container();
  private markers = new Graphics();
  private labels = new Container();
  private selection = new Graphics();
  private movementRange = new Graphics();
  private plannedRoute = new Graphics();
  private routePreview = new Graphics();
  private cellData = new Map<number, Cell>();
  private chunkVersions = new Map<string, number>();
  private chunks = new Map<string, ChunkView>();
  private markerChunks = new Map<string, Marker[]>();
  private settlementCells = new Set<number>();
  private factionColors = new Map<string, number>();
  private factionDefinitions = new Map<string, string>();
  private enemyFactions = new Set<string>();
  private labelPool: Text[] = [];
  private observation: Observation | undefined;
  private selected: number | undefined;
  private cameraDirty = true;
  private markerDirty = true;
  private viewportKey = '';
  private frame = 0;
  private previousFrame = 0;
  private samples: number[] = [];
  private resizeObserver: ResizeObserver | undefined;
  private disposed = false;
  private initialized = false;
  private pointer: { id: number; x: number; y: number; lastX: number; lastY: number; moved: boolean } | undefined;
  private cleanup: (() => void)[] = [];
  private clearHovered: (() => void) | undefined;
  private art: RuntimeArt | undefined;
  private artStatus: ArtStatus = { state: 'loading', message: 'Loading approved pixel art…', atlasPages: 0, residentBytesEstimate: 0, downloadBytes: 0, loadMs: 0, warnings: [] };
  private figurePool: Sprite[] = [];
  private terrainPool: Sprite[] = [];
  private visibleAnimations: { sprite: Sprite; contentId: string; phase: number; frameId: string }[] = [];
  private visibleAssetIds = new Set<string>();
  private visibleEntityArt: { entityId: string; factionId: string; definitionId: string | null; role: string; assetId: string | null; presentation: string; nativeWidth: number | null; nativeHeight: number | null; tint: number | null }[] = [];
  private visibleArtWarnings: string[] = [];
  private reducedMotion = false;
  private metrics: RenderMetrics = { renderer: 'webgl', frameCount: 0, frameMs: 0, frameP95Ms: 0, renderCpuMs: 0, visibleCells: 0, visibleChunks: 0, cachedChunks: 0, chunkRebuilds: 0, visibleEntities: 0, zoom: 1, highlightedCells: 0, routeCells: 0, previewCells: 0, atlasPages: 0, residentAtlasBytesEstimate: 0, artLoadMs: 0, artFirstRenderCpuMs: -1, visibleSprites: 0, terrainSpriteCells: 0, pooledSprites: 0 };

  constructor(private readonly onArtStatus?: (status: ArtStatus) => void) {}

  async mount(host: HTMLElement, onSelect: (cell: number, input: MapPointerInput) => void, onHover: (cell: number | undefined) => void = () => undefined): Promise<void> {
    await this.app.init({ width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight), background: 0x1a252a, preference: 'webgl', autoStart: false, antialias: true, resolution: Math.min(window.devicePixelRatio, 1.5), autoDensity: true });
    this.initialized = true;
    if (this.disposed) { this.app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true }); return; }
    host.appendChild(this.app.canvas);
    this.app.canvas.setAttribute('aria-hidden', 'true');
    this.world.addChild(this.terrain, this.figures, this.movementRange, this.plannedRoute, this.routePreview, this.markers, this.labels, this.selection);
    this.app.stage.addChild(this.world);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { this.reducedMotion = media.matches; this.markerDirty = true; this.cameraDirty = true; };
    motion(); media.addEventListener('change', motion); this.cleanup.push(() => media.removeEventListener('change', motion));
    this.onArtStatus?.(this.artStatus);
    void RuntimeArt.load().then(art => {
      if (this.disposed) { art.destroy(); return; }
      this.art = art; this.artStatus = art.status;
      this.metrics.atlasPages = art.status.atlasPages; this.metrics.residentAtlasBytesEstimate = art.status.residentBytesEstimate; this.metrics.artLoadMs = art.status.loadMs;
      for (const chunk of this.chunks.values()) this.destroyChunk(chunk);
      this.chunks.clear(); this.viewportKey = ''; this.markerDirty = true; this.cameraDirty = true;
      this.onArtStatus?.(this.artStatus);
    }).catch(error => {
      if (this.disposed) return;
      this.artStatus = { ...this.artStatus, state: 'fallback', message: 'Pixel art unavailable. Procedural role markers remain active.', warnings: [error instanceof Error ? error.message : String(error)] };
      this.onArtStatus?.(this.artStatus);
    });
    const canvas = this.app.canvas;
    const activePointers = new Set<number>();
    let hovered: number | undefined;
    const hover = (cell: number | undefined) => { if (cell !== hovered) { hovered = cell; onHover(cell); } };
    this.clearHovered = () => hover(undefined);
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      activePointers.add(event.pointerId);
      if (activePointers.size > 1) { this.pointer = undefined; hover(undefined); return; }
      canvas.setPointerCapture(event.pointerId);
      this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    };
    const move = (event: PointerEvent) => {
      if (!this.pointer) {
        if (!activePointers.size && event.pointerType !== 'touch') { const rect = canvas.getBoundingClientRect(); hover(this.pick(event.clientX - rect.left, event.clientY - rect.top)); }
        return;
      }
      if (event.pointerId !== this.pointer.id) return;
      const pointer = this.pointer;
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 5) pointer.moved = true;
      if (pointer.moved) { hover(undefined); this.pan(event.clientX - pointer.lastX, event.clientY - pointer.lastY); }
      pointer.lastX = event.clientX; pointer.lastY = event.clientY;
    };
    const up = (event: PointerEvent) => {
      if (this.pointer?.id === event.pointerId && !this.pointer.moved && Math.hypot(event.clientX - this.pointer.x, event.clientY - this.pointer.y) <= 5) {
        const rect = canvas.getBoundingClientRect();
        const cell = this.pick(event.clientX - rect.left, event.clientY - rect.top);
        if (cell !== undefined) onSelect(cell, { shiftKey: event.shiftKey, pointerType: event.pointerType });
      }
      if (this.pointer?.id === event.pointerId) this.pointer = undefined;
      activePointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const cancel = (event: PointerEvent) => { activePointers.delete(event.pointerId); if (this.pointer?.id === event.pointerId) this.pointer = undefined; hover(undefined); };
    const leave = () => { if (!this.pointer) hover(undefined); };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      hover(undefined);
      const rect = canvas.getBoundingClientRect();
      this.zoom(Math.exp(-event.deltaY * 0.0015), event.clientX - rect.left, event.clientY - rect.top);
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('wheel', wheel, { passive: false });
    this.cleanup.push(() => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('wheel', wheel); });
    this.resizeObserver = new ResizeObserver(() => {
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      this.pan((width - this.app.screen.width) / 2, (height - this.app.screen.height) / 2);
      this.app.renderer.resize(width, height); this.cameraDirty = true;
    });
    this.resizeObserver.observe(host);
    if (this.observation) this.focus(this.selected ?? this.observation.armies[0]?.cell ?? 0);
    this.frame = requestAnimationFrame(this.tick);
  }

  update(observation: Observation, reset: boolean): void {
    this.observation = observation;
    if (reset) {
      this.cellData.clear(); this.chunkVersions.clear();
      this.setMovementRange([]); this.setRoute(); this.setPreview();
      for (const view of this.chunks.values()) this.destroyChunk(view);
      this.chunks.clear(); this.viewportKey = '';
    }
    for (const cell of observation.cells) {
      this.cellData.set(cell.cell, cell);
      const key = this.chunkKey(cell.cell);
      this.chunkVersions.set(key, (this.chunkVersions.get(key) ?? 0) + 1);
    }
    this.markerChunks.clear();
    this.settlementCells = new Set([...observation.settlements.map(settlement => settlement.cell), ...observation.ruins.map(ruin => ruin.cell)]);
    this.factionColors = new Map(observation.factions.map(faction => [faction.id, faction.color]));
    this.factionDefinitions = new Map(observation.factions.map(faction => [faction.id, faction.definitionId]));
    this.enemyFactions = new Set(observation.wars);
    for (const entity of [...observation.settlements.map(item => ({ ...item, settlement: true })), ...observation.armies.map(item => ({ ...item, settlement: false })), ...observation.ruins.map(item => ({ id: item.id, cell: item.cell, name: item.name, factionId: '', settlement: false, ruin: true }))]) {
      const key = this.chunkKey(entity.cell);
      const list = this.markerChunks.get(key) ?? [];
      list.push(entity); this.markerChunks.set(key, list);
    }
    this.cameraDirty = true; this.markerDirty = true;
    if (reset && this.initialized) this.focus(observation.armies.find(army => army.factionId === observation.factionId)?.cell ?? observation.settlements[0]?.cell ?? 0);
  }

  inspect(cell: number): Cell | undefined { return this.cellData.get(cell); }
  getTerrainArt(cell: number) {
    const observed = this.cellData.get(cell); if (!observed) return;
    const assetId = BIOME_ART_IDS[observed.biome];
    const approved = Boolean(assetId && this.art?.frame(assetId));
    return { cell, biome: observed.biome, terrain: observed.terrain, assetId: approved ? assetId : null, approved, relief: terrainRelief(observed.terrain, observed.biome, approved), visible: observed.visible };
  }
  resetHover(): void { this.clearHovered?.(); }
  /** Read-only screen projection for accessible integrations and real canvas-click tests. */
  projectCell(cell: number): { x: number; y: number; inViewport: boolean } | undefined {
    if (!this.initialized || !this.observation || !Number.isInteger(cell) || cell < 0 || cell >= this.observation.width * this.observation.height) return undefined;
    const [cx, cy] = this.center(cell), rect = this.app.canvas.getBoundingClientRect();
    const x = cx * this.world.scale.x + this.world.x, y = cy * this.world.scale.y + this.world.y;
    return { x: rect.left + x, y: rect.top + y, inViewport: x >= 0 && y >= 0 && x < rect.width && y < rect.height };
  }
  setMovementRange(cells: readonly { cell: number; cost: number }[]): void {
    this.movementRange.clear(); this.metrics.highlightedCells = cells.length;
    if (!this.observation) return;
    for (const entry of cells) { const [x, y] = this.center(entry.cell); this.hex(this.movementRange, x, y, RADIUS - 3).fill({ color: 0xd3e3a7, alpha: 0.12 }).stroke({ color: 0xd3e3a7, width: 1.4, alpha: 0.7 }); }
  }
  setRoute(route?: RouteVisual): void { this.drawRoute(this.plannedRoute, route, false); this.metrics.routeCells = route?.path.length ?? 0; }
  setPreview(route?: RouteVisual): void { this.drawRoute(this.routePreview, route, true); this.metrics.previewCells = route?.path.length ?? 0; }
  getExploredCount(): number { return this.cellData.size; }
  getArtDiagnostics() { return { ...this.artStatus, warnings: [...this.artStatus.warnings, ...this.visibleArtWarnings], visibleAssetIds: [...this.visibleAssetIds].sort(), visibleEntityArt: this.visibleEntityArt.map(item => ({ ...item })), visibleAnimationFrames: this.visibleAnimations.map(({ contentId, frameId }) => ({ contentId, frameId })), reducedMotion: this.reducedMotion, visibleSprites: this.metrics.visibleSprites, terrainSpriteCells: this.metrics.terrainSpriteCells, lod: this.world.scale.x < .65 ? 'strategic-glyphs' : this.world.scale.x < 1.2 ? 'static-sprites' : 'near-sprites', terrainPresentation: { nativeFootprint: [56, 64], scaleX: HEX_WIDTH / 56, scaleY: RADIUS / 32, note: 'Approved native tiles fitted to the unchanged regular hex grid; fractional display scaling is not pixel-perfect.' } }; }
  getMetrics(): RenderMetrics {
    const sorted = [...this.samples].sort((a, b) => a - b);
    return { ...this.metrics, pooledSprites: this.figurePool.length + this.terrainPool.length + [...this.chunks.values()].reduce((sum, chunk) => sum + chunk.sprites.length, 0), frameP95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0, cachedChunks: this.chunks.size, zoom: this.world.scale.x };
  }
  select(cell: number | undefined): void { this.selected = cell; this.redrawSelection(); }
  focus(cell: number): void {
    this.resetHover();
    this.selected = cell;
    if (!this.initialized) return;
    const [x, y] = this.center(cell);
    this.world.position.set(this.app.screen.width / 2 - x * this.world.scale.x, this.app.screen.height / 2 - y * this.world.scale.x);
    this.cameraDirty = true; this.redrawSelection();
  }
  pan(dx: number, dy: number): void { this.resetHover(); this.world.x += dx; this.world.y += dy; this.cameraDirty = true; }
  zoom(factor: number, x?: number, y?: number): void {
    this.resetHover();
    if (!this.initialized) return;
    const px = x ?? this.app.screen.width / 2, py = y ?? this.app.screen.height / 2;
    const old = this.world.scale.x, next = Math.max(0.35, Math.min(2.2, old * factor));
    this.world.position.set(px - (px - this.world.x) * next / old, py - (py - this.world.y) * next / old);
    this.world.scale.set(next); this.cameraDirty = true;
  }
  destroy(): void {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resizeObserver?.disconnect(); this.cleanup.forEach(fn => fn());
    if (!this.initialized) return;
    this.terrainPool.forEach(sprite => sprite.destroy());
    for (const view of this.chunks.values()) view.root.cacheAsTexture(false);
    this.app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
    this.art?.destroy();
  }

  private center(cell: number): [number, number] {
    const width = this.observation?.width ?? 1, row = Math.floor(cell / width);
    return [(cell % width + (row & 1) * 0.5) * HEX_WIDTH, row * ROW_HEIGHT];
  }
  private chunkKey(cell: number): string {
    const width = this.observation!.width;
    return `${Math.floor(cell % width / CHUNK)},${Math.floor(Math.floor(cell / width) / CHUNK)}`;
  }
  private pick(px: number, py: number): number | undefined {
    if (!this.observation) return undefined;
    const x = (px - this.world.x) / this.world.scale.x, y = (py - this.world.y) / this.world.scale.x;
    const row = Math.round(y / ROW_HEIGHT), column = Math.round(x / HEX_WIDTH - (row & 1) * 0.5);
    let closest: number | undefined, distance = RADIUS * RADIUS;
    for (let r = row - 1; r <= row + 1; r++) for (let c = column - 1; c <= column + 1; c++) {
      if (r < 0 || c < 0 || r >= this.observation.height || c >= this.observation.width) continue;
      const cell = r * this.observation.width + c, [cx, cy] = this.center(cell), squared = (cx - x) ** 2 + (cy - y) ** 2;
      if (squared < distance) { distance = squared; closest = cell; }
    }
    return closest;
  }
  private hex(graphics: Graphics, x: number, y: number, radius = RADIUS): Graphics { return graphics.regularPoly(x, y, radius, 6); }
  private drawRoute(graphics: Graphics, route: RouteVisual | undefined, preview: boolean): void {
    graphics.clear();
    if (!route || !this.observation || !route.path.length) return;
    const color = route.attack ? 0xf09b7d : route.paused ? 0xc69f75 : preview ? 0xffdda2 : 0x90c9c4;
    const [ox, oy] = this.center(route.origin); graphics.moveTo(ox, oy);
    for (const cell of route.path) { const [x, y] = this.center(cell); graphics.lineTo(x, y); }
    graphics.stroke({ color, width: preview ? 3 : 2, alpha: preview ? 0.95 : 0.7 });
    for (const cell of route.path) { const [x, y] = this.center(cell); graphics.circle(x, y, preview ? 3 : 2).fill({ color, alpha: 0.95 }); }
    for (const cell of route.waypoints ?? []) { const [x, y] = this.center(cell); graphics.poly([x, y - 9, x + 9, y, x, y + 9, x - 9, y]).stroke({ color, width: 2 }); }
    const [tx, ty] = this.center(route.path.at(-1)!);
    if (route.attack) graphics.moveTo(tx - 8, ty - 8).lineTo(tx + 8, ty + 8).moveTo(tx + 8, ty - 8).lineTo(tx - 8, ty + 8).stroke({ color, width: 3 });
    else this.hex(graphics, tx, ty, RADIUS - 7).stroke({ color, width: 2 });
  }
  private destroyChunk(view: ChunkView): void {
    view.root.cacheAsTexture(false);
    for (const sprite of view.sprites) { sprite.removeFromParent(); sprite.visible = false; if (this.terrainPool.length < CHUNK * CHUNK * 16) this.terrainPool.push(sprite); else sprite.destroy(); }
    view.root.removeFromParent(); view.root.destroy({ children: true });
  }
  private makeChunk(cx: number, cy: number, key: string): ChunkView {
    const root = new Container(), tiles = new Container(), graphics = new Graphics(); root.addChild(tiles, graphics); this.terrain.addChild(root);
    const sprites: Sprite[] = []; let artCells = 0, count = 0;
    const width = this.observation!.width, height = this.observation!.height;
    for (let row = cy * CHUNK; row < Math.min(height, (cy + 1) * CHUNK); row++) for (let col = cx * CHUNK; col < Math.min(width, (cx + 1) * CHUNK); col++) {
      const cell = this.cellData.get(row * width + col);
      if (!cell) continue;
      count++;
      const [x, y] = this.center(cell.cell), color = BIOME_COLORS[cell.biome] ?? TERRAIN_COLORS[cell.terrain] ?? 0x777777, alpha = cell.visible ? 1 : 0.4;
      const artFrame = this.art?.frame(BIOME_ART_IDS[cell.biome] ?? '');
      const relief = terrainRelief(cell.terrain, cell.biome, Boolean(artFrame));
      if (artFrame) {
        const sprite = this.terrainPool.pop() ?? new Sprite(); sprite.texture = artFrame.texture;
        sprite.anchor.set(artFrame.asset.pivot[0] / artFrame.asset.nativeResolution.width, artFrame.asset.pivot[1] / artFrame.asset.nativeResolution.height);
        // Exact regular-hex footprint fit; no canonical projection or picking changes.
        sprite.scale.set(HEX_WIDTH / 56, RADIUS / 32); sprite.position.set(x, y); sprite.alpha = alpha; sprite.visible = true; sprite.roundPixels = true;
        tiles.addChild(sprite); sprites.push(sprite); artCells++;
        this.hex(graphics, x, y).stroke({ color: 0x202d29, width: 0.7, alpha: 0.55 });
      } else this.hex(graphics, x, y).fill({ color, alpha }).stroke({ color: 0x202d29, width: 0.7, alpha: 0.55 });
      if (relief === 'hill-ridges') {
        // A 20×8 lower-edge cue leaves the tile's actual surface visible and distinguishes hills from peaks.
        graphics.moveTo(x - 10, y + 16).lineTo(x - 5, y + 10).lineTo(x, y + 16).moveTo(x - 1, y + 16).lineTo(x + 5, y + 10).lineTo(x + 11, y + 16).stroke({ color: 0x202328, width: 3.8, alpha });
        graphics.moveTo(x - 10, y + 15).lineTo(x - 5, y + 9).lineTo(x, y + 15).moveTo(x - 1, y + 15).lineTo(x + 5, y + 9).lineTo(x + 11, y + 15).stroke({ color: 0xd2c4a6, width: 1.5, alpha });
      } else if (relief === 'procedural-peak') {
        graphics.poly([x - 14, y + 10, x + 1, y - 14, x + 16, y + 10]).fill({ color: 0x4d5149, alpha });
        graphics.moveTo(x + 1, y - 14).lineTo(x + 7, y - 3).lineTo(x + 1, y - 5).lineTo(x - 4, y - 3).stroke({ color: 0xc0bca7, width: 1.5, alpha });
      } else if (artFrame) {
        // Alpine pixels already depict canonical mountains; retain relief for other combinations.
      } else if (cell.biome === 5) {
        graphics.moveTo(x - 16, y + 5).quadraticCurveTo(x - 5, y - 6, x + 13, y + 3).moveTo(x - 8, y + 11).quadraticCurveTo(x + 1, y + 4, x + 16, y + 10).stroke({ color: 0xd2b47c, width: 1.7, alpha: alpha * 0.7 });
      } else if (cell.biome === 7) {
        for (const offset of [-8, 7]) graphics.moveTo(x + offset, y + 9).lineTo(x + offset, y - 6).moveTo(x + offset - 4, y - 2).lineTo(x + offset, y + 2).lineTo(x + offset + 4, y - 4).stroke({ color: 0xa1b993, width: 1.5, alpha: alpha * 0.8 });
        graphics.moveTo(x - 12, y + 12).lineTo(x + 12, y + 12).stroke({ color: 0x8fb9b5, width: 1, alpha: alpha * 0.6 });
      } else if (cell.terrain === 2) {
        for (const offset of [-9, 8]) graphics.poly([x + offset - 6, y + 7, x + offset, y - 11, x + offset + 6, y + 7]).fill({ color: 0x263f35, alpha });
        if (cell.biome === 3) graphics.moveTo(x - 12, y - 1).lineTo(x - 9, y - 10).lineTo(x - 6, y - 1).moveTo(x + 5, y - 1).lineTo(x + 8, y - 10).lineTo(x + 11, y - 1).stroke({ color: 0xc0d0c6, width: 1.2, alpha: alpha * 0.75 });
        if (cell.biome === 8) graphics.circle(x - 8, y - 8, 6).circle(x + 8, y - 9, 7).fill({ color: 0x3c7650, alpha });
      } else if (cell.terrain === 0) {
        graphics.moveTo(x - 10, y).lineTo(x - 3, y + 2).lineTo(x + 4, y).lineTo(x + 11, y + 2).stroke({ color: 0x76939a, width: 1, alpha: alpha * 0.45 });
      } else if (cell.biome === 4) {
        graphics.moveTo(x - 10, y + 5).lineTo(x - 2, y + 5).moveTo(x + 2, y - 3).lineTo(x + 12, y - 3).moveTo(x - 5, y + 1).lineTo(x - 5, y + 9).stroke({ color: 0xd9ddd1, width: 1.5, alpha: alpha * 0.7 });
      } else {
        graphics.moveTo(x - 8, y + 7).lineTo(x - 6, y + 2).moveTo(x + 7, y - 2).lineTo(x + 9, y - 7).stroke({ color: 0xc4b883, width: 1, alpha: alpha * 0.4 });
      }
    }
    if (count) root.cacheAsTexture({ resolution: 1, antialias: false, scaleMode: 'nearest' });
    this.metrics.chunkRebuilds++;
    return { root, count, version: this.chunkVersions.get(key) ?? 0, used: this.metrics.frameCount, sprites, artCells };
  }
  private redrawSelection(): void {
    this.selection.clear();
    if (this.selected === undefined || !this.observation) return;
    const [x, y] = this.center(this.selected);
    this.hex(this.selection, x, y, RADIUS - 2).stroke({ color: 0xffdfa0, width: 2.5 });
    this.hex(this.selection, x, y, RADIUS + 2).stroke({ color: 0xffdfa0, width: 0.6, alpha: 0.6 });
  }
  private refreshViewport(): void {
    if (!this.observation) return;
    const zoom = this.world.scale.x, width = this.observation.width, height = this.observation.height;
    const minX = Math.max(0, Math.floor((-this.world.x / zoom / HEX_WIDTH - 2) / CHUNK));
    const maxX = Math.min(Math.ceil(width / CHUNK) - 1, Math.floor(((this.app.screen.width - this.world.x) / zoom / HEX_WIDTH + 2) / CHUNK));
    const minY = Math.max(0, Math.floor((-this.world.y / zoom / ROW_HEIGHT - 2) / CHUNK));
    const maxY = Math.min(Math.ceil(height / CHUNK) - 1, Math.floor(((this.app.screen.height - this.world.y) / zoom / ROW_HEIGHT + 2) / CHUNK));
    const viewportKey = `${minX},${maxX},${minY},${maxY},${zoom < 0.65}`;
    const changed = viewportKey !== this.viewportKey; this.viewportKey = viewportKey;
    const visible = new Set<string>(); let cells = 0, artCells = 0;
    for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) {
      const key = `${cx},${cy}`;
      if (!this.chunkVersions.has(key)) continue;
      visible.add(key);
      let view = this.chunks.get(key);
      if (view && view.version !== this.chunkVersions.get(key)) { this.destroyChunk(view); view = undefined; }
      if (!view) { view = this.makeChunk(cx, cy, key); this.chunks.set(key, view); }
      view.root.visible = true; view.used = this.metrics.frameCount; cells += view.count; artCells += view.artCells;
    }
    for (const [key, view] of this.chunks) if (!visible.has(key)) view.root.visible = false;
    // The retained offscreen cache is bounded, independent of campaign world size.
    if (this.chunks.size > 64) {
      const old = [...this.chunks].filter(([key]) => !visible.has(key)).sort((a, b) => a[1].used - b[1].used);
      for (const [key, view] of old) { if (this.chunks.size <= 64) break; this.destroyChunk(view); this.chunks.delete(key); }
    }
    this.metrics.visibleCells = cells; this.metrics.visibleChunks = visible.size; this.metrics.terrainSpriteCells = artCells;
    if (changed || this.markerDirty || this.art) {
      this.markers.clear(); this.labelPool.forEach(label => { label.visible = false; });
      this.figurePool.forEach(sprite => { sprite.visible = false; }); this.visibleAnimations = []; this.visibleAssetIds.clear(); this.visibleEntityArt = [];
      const warnings = new Set<string>(), strategicGroups = new Set<string>();
      let labels = 0, entities = 0, figures = 0;
      for (const key of visible) for (const entity of this.markerChunks.get(key) ?? []) {
        const [x, y] = this.center(entity.cell), own = entity.factionId === this.observation.factionId;
        const sx = x * zoom + this.world.x, sy = y * zoom + this.world.y;
        if (sx < -100 || sy < -100 || sx > this.app.screen.width + 100 || sy > this.app.screen.height + 100) continue;
        entities++;
        const far = zoom < .65;
        // One far badge per observed cell/culture, not a pile of identical co-located sprites.
        if (far) {
          const group = `${entity.cell}/${entity.factionId}/${entity.ruin ? 'ruin' : entity.settlement ? 'town' : 'army'}`;
          if (strategicGroups.has(group)) continue;
          strategicGroups.add(group);
        }
        const hostile = this.enemyFactions.has(entity.factionId);
        const color = this.factionColors.get(entity.factionId) ?? 0xc9a66b;
        const contentId = entity.ruin ? 'map.ruin' : entity.settlement ? (entity.population ?? 0) >= 12 ? 'settlement.city' : (entity.population ?? 0) >= 6 ? 'settlement.town' : 'settlement.village' : entity.unitId ?? '';
        const definitionId = this.factionDefinitions.get(entity.factionId);
        const selectedArt = selectEntityArt(contentId, definitionId, far, id => this.art?.byContent.has(id) ?? false);
        const artFrame = selectedArt.contentId ? this.art?.frame(selectedArt.contentId) : undefined;
        if (this.art && selectedArt.warning) warnings.add(selectedArt.warning);
        this.visibleEntityArt.push({ entityId: entity.id, factionId: entity.factionId, definitionId: definitionId ?? null, role: contentId, assetId: artFrame?.asset.id ?? null, presentation: selectedArt.presentation, nativeWidth: artFrame?.asset.nativeResolution.width ?? null, nativeHeight: artFrame?.asset.nativeResolution.height ?? null, tint: artFrame ? 0xffffff : null });
        if (artFrame) {
          const sprite = this.figurePool[figures] ?? new Sprite();
          if (!this.figurePool[figures]) { this.figures.addChild(sprite); this.figurePool.push(sprite); }
          const offset = !entity.settlement && !entity.ruin && this.settlementCells.has(entity.cell) ? 16 : 0;
          sprite.texture = artFrame.texture; sprite.anchor.set(artFrame.asset.pivot[0] / artFrame.asset.nativeResolution.width, artFrame.asset.pivot[1] / artFrame.asset.nativeResolution.height);
          sprite.position.set(x + offset, y + offset);
          // Strategic assets are authored separately: exact 2:1 reduction, screen-constant,
          // nearest sampled. No miniature humanoid silhouettes or additional banner overlay.
          if (far) sprite.scale.set(.5 / zoom); else sprite.scale.set(HEX_WIDTH / 56, RADIUS / 32);
          sprite.tint = 0xffffff; sprite.alpha = 1; sprite.visible = true; sprite.roundPixels = true;
          this.visibleAssetIds.add(artFrame.asset.id); figures++;
          if (!entity.settlement && !entity.ruin && !this.reducedMotion && zoom >= 1.2 && artFrame.asset.clips.some(clip => clip.state === 'idle' && clip.frames.length > 1)) this.visibleAnimations.push({ sprite, contentId: selectedArt.contentId!, phase: Number(entity.id.split('.').at(-1) ?? 0) * 37, frameId: artFrame.frameId });
          // A separate ownership/status base stays readable without tinting the art.
          this.markers.ellipse(x + offset, y + offset + 2, 13, 5).stroke({ color, width: 2 });
          if (own) this.markers.poly([x + offset - 3, y + offset + 2, x + offset, y + offset - 3, x + offset + 3, y + offset + 2]).fill(color);
          else if (hostile) this.markers.moveTo(x + offset - 4, y + offset - 3).lineTo(x + offset + 4, y + offset + 4).moveTo(x + offset + 4, y + offset - 3).lineTo(x + offset - 4, y + offset + 4).stroke({ color, width: 2 });
          else this.markers.poly([x + offset, y + offset - 4, x + offset + 4, y + offset, x + offset, y + offset + 4, x + offset - 4, y + offset]).stroke({ color, width: 1.5 });
        } else if (entity.ruin) {
          this.markers.poly([x - 12, y + 10, x - 12, y - 9, x - 6, y - 3, x - 2, y - 7, x - 2, y + 10]).fill(0x27302b).stroke({ color: 0xb8aa89, width: 2 });
          this.markers.moveTo(x + 2, y + 10).lineTo(x + 5, y - 3).lineTo(x + 11, y - 8).lineTo(x + 11, y + 10).stroke({ color: 0xb8aa89, width: 2 });
          this.markers.moveTo(x - 15, y + 12).lineTo(x + 15, y + 12).stroke({ color: 0xb8aa89, width: 1.5 });
        } else if (entity.settlement) {
          this.markers.rect(x - 9, y - 7, 18, 17).fill(0x202b2a).stroke({ color, width: 2 });
          const roof = this.markers.poly([x - 13, y - 7, x, y - 19, x + 13, y - 7]);
          if (own) roof.fill(color); else roof.stroke({ color, width: 2 });
        } else {
          const offset = this.settlementCells.has(entity.cell) ? 16 : 0;
          this.markers.circle(x + offset, y + offset, 10).fill(0x202b2a).stroke({ color, width: 2 });
          if (own) this.markers.poly([x - 4 + offset, y + 4 + offset, x + offset, y - 5 + offset, x + 4 + offset, y + 4 + offset]).fill(color);
          else if (hostile) this.markers.moveTo(x - 4 + offset, y - 4 + offset).lineTo(x + 4 + offset, y + 4 + offset).moveTo(x + 4 + offset, y - 4 + offset).lineTo(x - 4 + offset, y + 4 + offset).stroke({ color, width: 2 });
          else this.markers.poly([x + offset, y - 5 + offset, x + 4 + offset, y + offset, x + offset, y + 5 + offset, x - 4 + offset, y + offset]).stroke({ color, width: 1.5 });
        }
        if (zoom >= 0.65 && (entity.settlement || !own)) {
          let label = this.labelPool[labels];
          if (!label) { label = new Text({ text: '', style: { fontFamily: 'Georgia', fontSize: 12, fill: 0xf0e6ce, stroke: { color: 0x172324, width: 4 }, padding: 4 } }); label.anchor.set(0.5, 0); this.labels.addChild(label); this.labelPool.push(label); }
          const text = entity.ruin ? `Ruins of ${entity.name}` : `${own ? '◆' : hostile ? '⚔' : '◇'} ${entity.name}`;
          if (label.text !== text) label.text = text;
          label.position.set(x, y + 20); label.visible = true; labels++;
        }
      }
      const nextWarnings = [...warnings].sort();
      if (nextWarnings.length !== this.visibleArtWarnings.length || nextWarnings.some((warning, index) => warning !== this.visibleArtWarnings[index])) {
        this.visibleArtWarnings = nextWarnings;
        this.onArtStatus?.({ ...this.artStatus, warnings: [...this.artStatus.warnings, ...nextWarnings] });
      }
      this.metrics.visibleEntities = entities; this.metrics.visibleSprites = figures; this.metrics.pooledSprites = this.figurePool.length + this.terrainPool.length; this.markerDirty = false;
    }
  }
  private tick = (time: number): void => {
    if (this.disposed) return;
    const started = performance.now();
    if (this.cameraDirty) { this.refreshViewport(); this.cameraDirty = false; }
    if (!document.hidden) for (const animation of this.visibleAnimations) { const frame = this.art?.frame(animation.contentId, time + animation.phase, true); if (frame && animation.sprite.texture !== frame.texture) { animation.sprite.texture = frame.texture; animation.frameId = frame.frameId; } }
    this.app.render();
    this.metrics.renderCpuMs = performance.now() - started;
    if (this.art && this.metrics.artFirstRenderCpuMs < 0) this.metrics.artFirstRenderCpuMs = this.metrics.renderCpuMs;
    this.metrics.frameCount++;
    if (this.previousFrame && !document.hidden) { const elapsed = time - this.previousFrame; this.metrics.frameMs = elapsed; this.samples.push(elapsed); if (this.samples.length > 240) this.samples.shift(); }
    this.previousFrame = time;
    this.frame = requestAnimationFrame(this.tick);
  };
}
