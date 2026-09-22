import { Application, CanvasTextMetrics, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import type { MapObservation, Observation } from '@theandril/sim';
import { RuntimeArt, type ArtStatus } from './art';
import { selectTerrainArt } from './terrain-variants';
import { terrainRelief } from './terrain-style';
import { selectEntityArt } from './faction-style';
import { mapArmyVisible, navalMarker, waterPresentation } from './naval-style';
import { dirtyTerritoryChunks, hexPerimeterAngles, IMPROVEMENT_GLYPHS, settlementArtRole, territoryEdges } from './territory-style';
import { drawImprovementGlyph } from './improvement-glyphs';
import { finishChunkBorders, measureChunkCache, type ChunkCacheSize } from './chunk-cache';
import { layoutMapLabels, type MapLabel, type MapLabelCandidate } from './map-overlays';
import { geographicConnections, lakeShoreAngles, riverHalfCurve } from './geography-style';
import { worldOverviewPixels, type WorldOverviewMode } from './world-overview';
export type { WorldOverviewMode } from './world-overview';
import { cameraPresentation, detailScaleFloor, nextCameraScale, worldFitScale } from './camera-scale';
import { armyRepresentatives, groupVisibleMarkers, observedFormationCount, orderVisibleMarkers } from './army-size';
import { isLake } from '@theandril/mapgen';
import { changedHearthCells, hearthAppearance, type HearthDistrict } from './hearth-appearance';
import { drawHearthGround, drawHearthBuilding } from './hearth-drawing';
import { armySpriteScale, strategicSpriteScale } from './entity-scale';
import { hitStrategicMarker, type MarkerHitTarget } from './marker-hit';
import { SelectedAssetVisual, type SelectedAssetTarget, type SelectedFallback } from './selected-asset';
import { fitTileArtwork, IMPROVEMENT_GLYPH_BOUNDS, TILE_RADIUS, tileArtworkRole, type TileFootprint } from './tile-footprint';
import { BattleScene, type BattleSceneView } from './battle-scene';
export type { BattleSceneView, BattlePlaybackProgress } from './battle-scene';
export { battleSceneHeight, battleIsPortrait, battleLayout, battleActorBounds } from './battle-layout';
export type { ArtStatus } from './art';
export { LIVE_ART_IDS } from './art';

const RADIUS = TILE_RADIUS;
const HEX_WIDTH = Math.sqrt(3) * RADIUS;
const ROW_HEIGHT = RADIUS * 1.5;
const CHUNK = 16;
const MAP_LABEL_STYLE = new TextStyle({ fontFamily: 'Georgia', fontSize: 12, fill: 0xf0e6ce, stroke: { color: 0x172324, width: 3 }, padding: 4 });
const STACK_BADGE_STYLE = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fontWeight: '600', fill: 0xffdfa0, stroke: { color: 0x172324, width: 4 }, padding: 3 });
const TERRAIN_COLORS = [0x25404b, 0x747658, 0x3f5a49, 0x877963, 0x777a76];
// Indexed by the map generator's stable biome IDs; these are visual colors only.
const BIOME_COLORS = [0x25404b, 0x747658, 0x3f5a49, 0x496668, 0x8d9993, 0xa28b62, 0x8b8760, 0x526e66, 0x345d45, 0x92958e, 0x786b60, 0xb8b8a0];
type Cell = Observation['cells'][number];
type SeededMapObservation = MapObservation & Pick<Observation, 'seed'>;
export interface MapPointerInput { shiftKey: boolean; pointerType: string; anchor?: { x: number; y: number }; entityId?: string }
export interface RouteVisual { origin: number; path: number[]; waypoints?: number[]; paused?: boolean; attack?: boolean }
type Marker = { id: string; cell: number; name: string; factionId: string; settlement: boolean; ruin?: boolean; unitId?: string; population?: number; domain?: 'land' | 'naval'; formationCount?: number };
type ChunkView = { root: Container; count: number; version: number; far: boolean; used: number; sprites: Sprite[]; animatedProps: { cell: number; contentId: string; alpha: number }[]; footprints: TileFootprint[]; artCells: number; borderEdges: number; improvementProps: number; riverSegments: number; roadSegments: number; districtStreetSegments: number; missingProps: boolean; cache: ChunkCacheSize };

export interface RenderMetrics {
  renderer: 'webgl'; frameCount: number; frameMs: number; frameP95Ms: number;
  renderCpuMs: number; visibleCells: number; visibleChunks: number;
  cachedChunks: number; chunkRebuilds: number; visibleEntities: number; zoom: number;
  highlightedCells: number; routeCells: number; previewCells: number;
  atlasPages: number; residentAtlasBytesEstimate: number; artLoadMs: number; artFirstRenderCpuMs: number;
  visibleSprites: number; terrainSpriteCells: number; pooledSprites: number;
  stackBadges: number; pooledStackBadges: number;
  territoryEdges: number; improvementProps: number;
  riverSegments: number; roadSegments: number; districtStreetSegments: number;
  overview: boolean; overviewTextureBytes: number;
  rangePerimeterEdges: number; visibleLabels: number; selectedCells: number; hoveredCells: number;
  maxCachedChunkWidth: number; maxCachedChunkHeight: number; cachedTextureBytesEstimate: number;
}

/** Only explored cells enter this view. Viewport work is bounded by visible chunks. */
/** A light wash of the seat's colour: it recolours borrowed art without hiding
 * its pixels, since a multiply tint only darkens. */
export function borrowedArtTint(color: number): number {
  const mix = (channel: number) => Math.round(255 - (255 - channel) * .45);
  return (mix((color >> 16) & 255) << 16) | (mix((color >> 8) & 255) << 8) | mix(color & 255);
}

export class WorldRenderer {
  private app = new Application();
  private world = new Container({ eventMode: 'none' });
  private battlefield = new BattleScene();
  private battleArtRequested = false;
  private campaignCamera?: { x: number; y: number; scale: number; overview: boolean; width: number; height: number };
  private terrain = new Container();
  private overviewSprite: Sprite | undefined;
  private overviewTexture: Texture | undefined;
  private overviewActive = false;
  private overviewDirty = true;
  private overviewMode: WorldOverviewMode = 'terrain';
  private overviewFactionIds: readonly string[] | undefined;
  private figures = new Container();
  private figureGround = new Graphics();
  private markerHitTargets: MarkerHitTarget[] = [];
  private hearthDistricts = new Map<number, HearthDistrict>();
  private claimedCells = new Map<string, Set<number>>();
  private animatedProps = new Container();
  private animatedPropPool: Sprite[] = [];
  private assetSelection = new SelectedAssetVisual();
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
  /** Seats that reuse another culture's art — repeated cultures and city-states —
   * wear their own colour so a crowded map never shows two identical banners.
   * Authored cultures keep their approved pixels untouched. */
  private factionTints = new Map<string, number>();
  private enemyFactions = new Set<string>();
  private labelPool: Text[] = [];
  private stackBadgePool: Text[] = [];
  private visibleStackBadges: { cell: number; factionId: string; entityId: string; domain: 'land' | 'naval'; armies: number; text: string }[] = [];
  private observation: SeededMapObservation | undefined;
  private selected: number | undefined;
  private selectedEntityId: string | undefined;
  private hovered: number | undefined;
  private visibleLabels: MapLabel[] = [];
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
  private visibleEntityArt: { entityId: string; factionId: string; definitionId: string | null; role: string; assetId: string | null; presentation: string; nativeWidth: number | null; nativeHeight: number | null; tint: number | null; formationCount: number | null; representativeCount: number; stackArmyCount: number; stackFormationCount: number; screenWidth?: number; screenHeight?: number }[] = [];
  private visibleArtWarnings: string[] = [];
  private visibleTileFootprints: TileFootprint[] = [];
  private reducedMotion = false;
  private metrics: RenderMetrics = { renderer: 'webgl', frameCount: 0, frameMs: 0, frameP95Ms: 0, renderCpuMs: 0, visibleCells: 0, visibleChunks: 0, cachedChunks: 0, chunkRebuilds: 0, visibleEntities: 0, zoom: 1, highlightedCells: 0, routeCells: 0, previewCells: 0, atlasPages: 0, residentAtlasBytesEstimate: 0, artLoadMs: 0, artFirstRenderCpuMs: -1, visibleSprites: 0, terrainSpriteCells: 0, pooledSprites: 0, stackBadges: 0, pooledStackBadges: 0, territoryEdges: 0, improvementProps: 0, riverSegments: 0, roadSegments: 0, districtStreetSegments: 0, overview: false, overviewTextureBytes: 0, rangePerimeterEdges: 0, visibleLabels: 0, selectedCells: 0, hoveredCells: 0, maxCachedChunkWidth: 0, maxCachedChunkHeight: 0, cachedTextureBytesEstimate: 0 };

  constructor(private readonly onArtStatus?: (status: ArtStatus) => void, private readonly resolveArtUrl?: (url: string) => string) {}

  async mount(host: HTMLElement, onSelect: (cell: number, input: MapPointerInput) => void, onHover: (cell: number | undefined) => void = () => undefined): Promise<void> {
    await this.app.init({ width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight), background: 0x1a252a, preference: 'webgl', autoStart: false, antialias: true, resolution: Math.min(window.devicePixelRatio, 1.5), autoDensity: true });
    this.initialized = true;
    if (this.disposed) { this.app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true }); return; }
    host.appendChild(this.app.canvas);
    this.app.canvas.setAttribute('aria-hidden', 'true');
    this.world.addChild(this.terrain, this.animatedProps, this.movementRange, this.figureGround, this.figures, this.plannedRoute, this.routePreview, this.markers, this.assetSelection.container, this.labels, this.selection);
    this.app.stage.addChild(this.world, this.battlefield.container);
    this.battlefield.resize(this.app.screen.width, this.app.screen.height);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { this.reducedMotion = media.matches; this.markerDirty = true; this.cameraDirty = true; };
    motion(); media.addEventListener('change', motion); this.cleanup.push(() => media.removeEventListener('change', motion));
    this.onArtStatus?.(this.artStatus);
    void RuntimeArt.load(undefined, this.resolveArtUrl).then(art => {
      if (this.disposed) { art.destroy(); return; }
      this.art = art; this.artStatus = art.status;
      if (this.battlefield.active) this.loadBattleArt();
      this.metrics.atlasPages = art.status.atlasPages; this.metrics.residentAtlasBytesEstimate = art.status.residentBytesEstimate; this.metrics.artLoadMs = art.status.loadMs;
      for (const chunk of this.chunks.values()) this.destroyChunk(chunk);
      this.chunks.clear(); this.viewportKey = ''; this.markerDirty = true; this.cameraDirty = true;
      // A glyph may already have reported its warning while the atlas loaded.
      // Preserve it here: the next frame only publishes changed warning sets.
      this.onArtStatus?.({ ...this.artStatus, warnings: [...this.artStatus.warnings, ...this.visibleArtWarnings] });
    }).catch(error => {
      if (this.disposed) return;
      this.artStatus = { ...this.artStatus, state: 'fallback', message: 'Pixel art unavailable. Procedural role markers remain active.', warnings: [error instanceof Error ? error.message : String(error)] };
      this.onArtStatus?.(this.artStatus);
    });
    const canvas = this.app.canvas;
    const activePointers = new Set<number>();
    let hovered: number | undefined;
    const hover = (cell: number | undefined) => { if (cell !== hovered) { hovered = cell; this.hovered = cell; this.markerDirty = true; this.cameraDirty = true; this.redrawSelection(); onHover(cell); } };
    this.clearHovered = () => hover(undefined);
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      activePointers.add(event.pointerId);
      if (activePointers.size > 1) { this.pointer = undefined; hover(undefined); return; }
      canvas.setPointerCapture(event.pointerId);
      this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    };
    const move = (event: PointerEvent) => {
      if (this.battlefield.active) return;
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
        if (this.battlefield.active) this.battlefield.pick(event.clientX - rect.left, event.clientY - rect.top);
        else {
          const px = event.clientX - rect.left, py = event.clientY - rect.top;
          const marker = this.pickMarker(px, py), cell = marker?.cell ?? this.pick(px, py);
          if (cell !== undefined) onSelect(cell, { shiftKey: event.shiftKey, pointerType: event.pointerType, anchor: { x: event.clientX, y: event.clientY }, ...(marker ? { entityId: marker.entityId } : {}) });
        }
      }
      if (this.pointer?.id === event.pointerId) this.pointer = undefined;
      activePointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const cancel = (event: PointerEvent) => { activePointers.delete(event.pointerId); if (this.pointer?.id === event.pointerId) this.pointer = undefined; hover(undefined); };
    const leave = () => { if (!this.pointer) hover(undefined); };
    const wheel = (event: WheelEvent) => {
      if (this.battlefield.active) return;
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
      const wasFit = this.overviewActive && this.world.scale.x <= this.fitScale() * 1.001;
      if (!this.battlefield.active) this.pan((width - this.app.screen.width) / 2, (height - this.app.screen.height) / 2);
      this.app.renderer.resize(width, height); this.cameraDirty = true;
      this.battlefield.resize(width, height);
      if (this.battlefield.active) return;
      if (wasFit) this.fitWorld();
      else if (this.observation) this.zoom(1);
    });
    this.resizeObserver.observe(host);
    if (this.observation) this.focus(this.selected ?? this.observation.armies[0]?.cell ?? 0);
    this.frame = requestAnimationFrame(this.tick);
  }

  update(observation: SeededMapObservation, reset: boolean, replaceMap = false): void {
    if (reset) this.setBattle(undefined);
    this.markerHitTargets = [];
    this.observation = observation;
    this.overviewDirty = true;
    if (reset || replaceMap) {
      this.assetSelection.clear();
      // Drop any revealed raster immediately, before a restored fog frame.
      this.overviewSprite?.removeFromParent(); this.overviewSprite?.destroy(); this.overviewSprite = undefined;
      this.overviewTexture?.destroy(true); this.overviewTexture = undefined; this.metrics.overviewTextureBytes = 0;
      if (reset) { this.overviewActive = false; this.overviewMode = 'terrain'; this.overviewFactionIds = undefined; }
      this.resetHover();
      if (reset) this.selectedEntityId = undefined;
      this.cellData.clear(); this.chunkVersions.clear(); this.claimedCells.clear(); this.hearthDistricts.clear();
      this.setMovementRange([]); this.setRoute(); this.setPreview();
      for (const view of this.chunks.values()) this.destroyChunk(view);
      this.chunks.clear(); this.viewportKey = '';
    }
    for (const cell of observation.cells) {
      const previous = this.cellData.get(cell.cell);
      this.cellData.set(cell.cell, cell);
      if (previous?.settlementId !== cell.settlementId) {
        if (previous?.settlementId) {
          const priorClaims = this.claimedCells.get(previous.settlementId);
          priorClaims?.delete(cell.cell);
          if (priorClaims?.size === 0) this.claimedCells.delete(previous.settlementId);
        }
        if (cell.settlementId) {
          let claims = this.claimedCells.get(cell.settlementId);
          if (!claims) { claims = new Set(); this.claimedCells.set(cell.settlementId, claims); }
          claims.add(cell.cell);
        }
      }
      const ownerChanged = (previous?.settlementId ?? null) !== (cell.settlementId ?? null) || (previous?.factionId ?? null) !== (cell.factionId ?? null);
      const edgeChanged = !previous || previous.hydrology !== cell.hydrology || previous.roadMask !== cell.roadMask || previous.visible !== cell.visible;
      for (const key of ownerChanged || edgeChanged ? dirtyTerritoryChunks(cell.cell, observation.width, observation.height, CHUNK) : [this.chunkKey(cell.cell)]) this.chunkVersions.set(key, (this.chunkVersions.get(key) ?? 0) + 1);
    }
    const districts = hearthAppearance(observation, this.claimedCells, cell => this.cellData.get(cell));
    for (const cell of changedHearthCells(this.hearthDistricts, districts)) {
      const key = this.chunkKey(cell); this.chunkVersions.set(key, (this.chunkVersions.get(key) ?? 0) + 1);
    }
    this.hearthDistricts = districts;
    this.markerChunks.clear();
    this.settlementCells = new Set([...observation.settlements.map(settlement => settlement.cell), ...observation.ruins.map(ruin => ruin.cell)]);
    this.factionColors = new Map(observation.factions.map(faction => [faction.id, faction.color]));
    this.factionDefinitions = new Map(observation.factions.map(faction => [faction.id, faction.definitionId]));
    this.factionTints = new Map(observation.factions.filter(faction => faction.id !== faction.definitionId)
      .map(faction => [faction.id, borrowedArtTint(faction.color)]));
    this.enemyFactions = new Set(observation.wars);
    for (const entity of [...observation.settlements.map(item => ({ ...item, settlement: true })), ...observation.armies.filter(mapArmyVisible).map(item => ({ ...item, formationCount: observedFormationCount(item), settlement: false })), ...observation.ruins.map(item => ({ id: item.id, cell: item.cell, name: item.name, factionId: '', settlement: false, ruin: true }))]) {
      const key = this.chunkKey(entity.cell);
      const list = this.markerChunks.get(key) ?? [];
      list.push(entity); this.markerChunks.set(key, list);
    }
    this.cameraDirty = true; this.markerDirty = true;
    this.redrawSelection();
    if (reset && this.initialized) this.focus(observation.armies.find(army => army.factionId === observation.factionId)?.cell ?? observation.settlements[0]?.cell ?? 0);
  }

  inspect(cell: number): Cell | undefined { return this.cellData.get(cell); }
  inspectEntities(cell: number) {
    if (!this.observation || !this.cellData.has(cell)) return [];
    return (this.markerChunks.get(this.chunkKey(cell)) ?? []).filter(entity => entity.cell === cell).map(entity => ({
      id: entity.id, name: entity.name, kind: entity.ruin ? 'ruin' : entity.settlement ? 'settlement' : entity.domain === 'naval' ? 'fleet' : 'army',
      faction: this.observation!.factions.find(faction => faction.id === entity.factionId)?.name ?? '',
    }));
  }
  getTerrainArt(cell: number) {
    const observed = this.cellData.get(cell); if (!observed) return;
    const selectedArt = selectTerrainArt(this.observation!.seed, cell, observed.biome, this.art);
    const approved = Boolean(selectedArt.frame);
    return { cell, biome: observed.biome, terrain: observed.terrain, waterDepth: observed.waterDepth, waterPresentation: waterPresentation(observed.terrain, observed.waterDepth), assetId: selectedArt.frame?.asset.id ?? null, approved, baseId: selectedArt.baseId, requestedAssetId: selectedArt.requestedAssetId, variantIndex: selectedArt.variantIndex, renderedVariantIndex: selectedArt.renderedVariantIndex, fallback: selectedArt.fallback, relief: terrainRelief(observed.terrain, observed.biome, approved), visible: observed.visible,
      settlementId: observed.settlementId ?? null, factionId: observed.factionId ?? null, improvementId: observed.improvementId ?? null, resourceId: observed.resourceId ?? null,
      district: this.hearthDistricts.get(cell) ?? null,
      improvementPresentation: observed.improvementId ? this.art?.frame(observed.improvementId) ? 'approved' : 'procedural' : null,
      territoryEdges: this.observation ? territoryEdges(observed, this.observation.width, this.observation.height, id => this.cellData.get(id)) : [],
      renderedTerritoryEdges: this.observation ? territoryEdges(observed, this.observation.width, this.observation.height, id => this.cellData.get(id), 'realm') : [],
      hydrology: observed.hydrology ?? 0, lake: isLake(observed.hydrology ?? 0), roadMask: observed.roadMask ?? 0,
      connections: this.observation ? geographicConnections(observed, this.observation.width, this.observation.height, id => this.cellData.get(id)) : { rivers: [], roads: [] },
      riverCurves: this.observation ? geographicConnections(observed, this.observation.width, this.observation.height, id => this.cellData.get(id)).rivers.map(connection => riverHalfCurve(cell, connection.neighbor, id => this.center(id))) : [],
      lakeShoreAngles: this.observation ? lakeShoreAngles(observed, this.observation.width, this.observation.height, id => this.cellData.get(id)) : [],
    };
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
    this.movementRange.clear(); this.metrics.highlightedCells = cells.length; this.metrics.rangePerimeterEdges = 0;
    if (!this.observation) return;
    const reachable = new Set(cells.filter(entry => this.cellData.has(entry.cell)).map(entry => entry.cell));
    for (const cell of reachable) {
      const [x, y] = this.center(cell);
      this.hex(this.movementRange, x, y).fill({ color: 0xa8cabe, alpha: .1 });
      for (const angle of hexPerimeterAngles(cell, this.observation.width, this.observation.height, id => reachable.has(id))) {
        this.edge(this.movementRange, x, y, angle).stroke({ color: 0xa8cabe, width: 1.6, alpha: .75 });
        this.metrics.rangePerimeterEdges++;
      }
    }
  }
  setRoute(route?: RouteVisual): void { this.drawRoute(this.plannedRoute, route, false); this.metrics.routeCells = route?.path.length ?? 0; }
  setPreview(route?: RouteVisual): void { this.drawRoute(this.routePreview, route, true); this.metrics.previewCells = route?.path.length ?? 0; }
  getExploredCount(): number { return this.cellData.size; }
  getArtDiagnostics() { const bounds = this.selection.getLocalBounds(); return { ...this.artStatus, warnings: [...this.artStatus.warnings, ...this.visibleArtWarnings], hearthDistricts: this.overviewActive ? [] : [...this.hearthDistricts.values()].filter(district => this.projectCell(district.cell)?.inViewport).map(district => { const assetId = this.world.scale.x >= .65 && district.kind !== 'construction' && district.kind !== 'cultivation' && district.buildingId ? this.art?.frame(district.buildingId)?.asset.id ?? null : null; return { ...district, assetId, presentation: this.world.scale.x < .65 ? 'ground' : assetId ? 'approved' : district.kind === 'housing' ? 'housing' : 'procedural' }; }), visibleAssetIds: [...this.visibleAssetIds].sort(), visibleEntityArt: this.visibleEntityArt.map(item => ({ ...item })), visibleAnimationFrames: this.visibleAnimations.map(({ contentId, frameId }) => ({ contentId, frameId })), tileFootprints: this.visibleTileFootprints.map(item => ({ ...item, bounds: { ...item.bounds }, anchor: { ...item.anchor }, ...(item.canvasBounds ? { canvasBounds: { ...item.canvasBounds } } : {}) })), reducedMotion: this.reducedMotion, visibleSprites: this.metrics.visibleSprites, terrainSpriteCells: this.metrics.terrainSpriteCells, overlays: { selectionBounds: { width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY }, selectedAsset: this.assetSelection.diagnostics(), selectedEntityTileOutline: false, territoryMode: 'realm-perimeter', ambientGrid: false, unselectedRings: false, labels: this.visibleLabels.map(label => ({ ...label })), stackBadges: this.visibleStackBadges.map(badge => ({ ...badge })), selectedCell: this.selected ?? null, hoveredCell: this.hovered ?? null }, lod: cameraPresentation(this.world.scale.x, this.overviewActive), terrainPresentation: { nativeFootprint: [56, 64], scaleX: HEX_WIDTH / 56, scaleY: RADIUS / 32, note: 'Approved native tiles fitted to the unchanged regular hex grid; fractional display scaling is not pixel-perfect.' } }; }
  getMetrics(): RenderMetrics {
    const sorted = [...this.samples].sort((a, b) => a - b);
    let pooledSprites = this.figurePool.length + this.terrainPool.length + this.animatedPropPool.length, maxCachedChunkWidth = 0, maxCachedChunkHeight = 0, cachedTextureBytesEstimate = 0;
    // Read stored construction measurements for the bounded ≤64 retained cache.
    // This excludes freed textures still retained by Pixi's pool and other GPU allocations.
    for (const chunk of this.chunks.values()) {
      pooledSprites += chunk.sprites.length;
      maxCachedChunkWidth = Math.max(maxCachedChunkWidth, chunk.cache.width);
      maxCachedChunkHeight = Math.max(maxCachedChunkHeight, chunk.cache.height);
      cachedTextureBytesEstimate += chunk.cache.bytesEstimate;
    }
    return { ...this.metrics, pooledSprites, pooledStackBadges: this.stackBadgePool.length, maxCachedChunkWidth, maxCachedChunkHeight, cachedTextureBytesEstimate, frameP95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0, cachedChunks: this.chunks.size, zoom: this.world.scale.x };
  }
  select(cell: number | undefined, entityId?: string): void { this.selected = cell; this.selectedEntityId = entityId; this.markerDirty = true; this.cameraDirty = true; this.redrawSelection(); }
  focus(cell: number): void {
    this.resetHover();
    if (this.selected !== cell) this.selectedEntityId = undefined;
    this.selected = cell;
    if (!this.initialized) return;
    if (this.overviewActive) { this.overviewActive = false; this.world.scale.set(1); }
    const [x, y] = this.center(cell);
    this.world.position.set(this.app.screen.width / 2 - x * this.world.scale.x, this.app.screen.height / 2 - y * this.world.scale.x);
    this.cameraDirty = true; this.markerDirty = true; this.redrawSelection();
  }
  pan(dx: number, dy: number): void { this.resetHover(); this.world.x += dx; this.world.y += dy; this.cameraDirty = true; }
  zoom(factor: number, x?: number, y?: number): void {
    this.resetHover();
    if (!this.initialized) return;
    const px = x ?? this.app.screen.width / 2, py = y ?? this.app.screen.height / 2;
    const old = this.world.scale.x;
    const step = nextCameraScale(old, factor, this.fitScale(), detailScaleFloor(this.app.screen.width, this.app.screen.height, CHUNK * HEX_WIDTH, CHUNK * ROW_HEIGHT));
    if (step.atFit) { this.fitWorld(); return; }
    const next = step.scale;
    this.overviewActive = step.overview;
    this.world.position.set(px - (px - this.world.x) * next / old, py - (py - this.world.y) * next / old);
    this.world.scale.set(next); this.cameraDirty = true;
    this.redrawSelection();
  }
  private fitScale(): number {
    if (!this.observation) return .001;
    return worldFitScale({ viewportWidth: this.app.screen.width, viewportHeight: this.app.screen.height,
      worldWidth: (this.observation.width + .5) * HEX_WIDTH, worldHeight: this.observation.height * ROW_HEIGHT });
  }
  /** Fit the permitted world using one cartographic texture, never all chunks. */
  setWorldOverview(mode: WorldOverviewMode, factionIds?: readonly string[]): void {
    const selected = factionIds === undefined ? undefined : [...new Set(factionIds)].sort();
    if (mode === this.overviewMode && JSON.stringify(selected) === JSON.stringify(this.overviewFactionIds)) return;
    this.overviewMode = mode; this.overviewFactionIds = selected;
    this.overviewDirty = true; this.cameraDirty = true;
  }
  getWorldOverview(): { mode: WorldOverviewMode; factionIds: readonly string[] | undefined } { return { mode: this.overviewMode, factionIds: this.overviewFactionIds ? [...this.overviewFactionIds] : undefined }; }
  fitWorld(): void {
    if (!this.initialized || !this.observation) return;
    this.resetHover(); this.overviewActive = true;
    const width = (this.observation.width + .5) * HEX_WIDTH, height = this.observation.height * ROW_HEIGHT;
    const scale = this.fitScale();
    this.world.scale.set(scale);
    this.world.position.set((this.app.screen.width - width * scale) / 2 + HEX_WIDTH / 2 * scale, (this.app.screen.height - height * scale) / 2 + ROW_HEIGHT / 2 * scale);
    this.cameraDirty = true; this.markerDirty = true; this.redrawSelection();
  }
  setBattle(view: BattleSceneView | undefined): void {
    const wasActive = this.battlefield.active;
    if (view && !wasActive) this.campaignCamera = { x: this.world.x, y: this.world.y, scale: this.world.scale.x, overview: this.overviewActive, width: this.initialized ? this.app.screen.width : 0, height: this.initialized ? this.app.screen.height : 0 };
    this.battlefield.set(view); this.world.visible = !view;
    if (view) { this.pointer = undefined; this.resetHover(); this.loadBattleArt(); }
    else if (wasActive) {
      const camera = this.campaignCamera;
      if (camera && this.initialized) { this.world.position.set(camera.x + (this.app.screen.width - camera.width) / 2, camera.y + (this.app.screen.height - camera.height) / 2); this.world.scale.set(camera.scale); this.overviewActive = camera.overview; }
      this.campaignCamera = undefined; this.cameraDirty = true; this.markerDirty = true;
    }
  }
  private loadBattleArt(): void {
    if (!this.art || this.battleArtRequested) return;
    this.battleArtRequested = true;
    void this.art.ensureBattle().then(() => {
      if (this.disposed || !this.art) return;
      this.battlefield.refreshArt();
      this.metrics.atlasPages = this.art.status.atlasPages; this.metrics.residentAtlasBytesEstimate = this.art.status.residentBytesEstimate;
      this.onArtStatus?.({ ...this.art.status });
    });
  }
  getBattleDiagnostics() { return this.battlefield.diagnostics(); }

  destroy(): void {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resizeObserver?.disconnect(); this.cleanup.forEach(fn => fn());
    if (!this.initialized) return;
    this.terrainPool.forEach(sprite => sprite.destroy());
    for (const view of this.chunks.values()) view.root.cacheAsTexture(false);
    this.overviewTexture?.destroy(true);
    this.assetSelection.destroy();
    this.battlefield.destroy();
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
  private pickMarker(px: number, py: number): MarkerHitTarget | undefined {
    if (this.overviewActive || this.world.scale.x >= .65) return undefined;
    return hitStrategicMarker(this.markerHitTargets, (px - this.world.x) / this.world.scale.x, (py - this.world.y) / this.world.scale.x);
  }
  private pick(px: number, py: number): number | undefined {
    if (!this.observation) return undefined;
    const marker = this.pickMarker(px, py);
    if (marker) return marker.cell;
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
  private edge(graphics: Graphics, x: number, y: number, angle: number): Graphics {
    const nx = Math.cos(angle), ny = Math.sin(angle), distance = HEX_WIDTH / 2, half = RADIUS / 2;
    return graphics.moveTo(x + nx * distance - ny * half, y + ny * distance + nx * half).lineTo(x + nx * distance + ny * half, y + ny * distance - nx * half);
  }
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
  private makeChunk(cx: number, cy: number, key: string, far: boolean): ChunkView {
    const root = new Container(), tiles = new Container(), graphics = new Graphics(), rivers = new Graphics(), roads = new Graphics(), props = new Container(), buildings = new Graphics(), borders = new Graphics(); root.addChild(tiles, graphics); this.terrain.addChild(root);
    const sprites: Sprite[] = [], animatedProps: ChunkView['animatedProps'] = [], footprints: TileFootprint[] = []; let artCells = 0, count = 0, borderEdges = 0, improvementProps = 0, riverSegments = 0, roadSegments = 0, districtStreetSegments = 0, missingProps = false;
    const width = this.observation!.width, height = this.observation!.height;
    for (let row = cy * CHUNK; row < Math.min(height, (cy + 1) * CHUNK); row++) for (let col = cx * CHUNK; col < Math.min(width, (cx + 1) * CHUNK); col++) {
      const cell = this.cellData.get(row * width + col);
      if (!cell) continue;
      count++;
      const water = waterPresentation(cell.terrain, cell.waterDepth);
      const [x, y] = this.center(cell.cell), color = water === 'deep' ? 0x1a303e : water === 'shallows' ? 0x3a6266 : BIOME_COLORS[cell.biome] ?? TERRAIN_COLORS[cell.terrain] ?? 0x777777, alpha = cell.visible ? 1 : 0.4;
      const artFrame = selectTerrainArt(this.observation!.seed, cell.cell, cell.biome, this.art).frame;
      const relief = terrainRelief(cell.terrain, cell.biome, Boolean(artFrame));
      if (artFrame) {
        const sprite = this.terrainPool.pop() ?? new Sprite(); sprite.texture = artFrame.texture;
        sprite.anchor.set(artFrame.asset.pivot[0] / artFrame.asset.nativeResolution.width, artFrame.asset.pivot[1] / artFrame.asset.nativeResolution.height);
        // Exact regular-hex footprint fit; no canonical projection or picking changes.
        sprite.scale.set(HEX_WIDTH / 56, RADIUS / 32); sprite.position.set(x, y); sprite.alpha = alpha; sprite.visible = true; sprite.roundPixels = true;
        tiles.addChild(sprite); sprites.push(sprite); artCells++;
      } else this.hex(graphics, x, y).fill({ color, alpha });
      if (isLake(cell.hydrology ?? 0)) {
        // A continuous basin surface; no individual pond disks or interior
        // tile rims. The quiet wash leaves some existing water texture visible.
        this.hex(graphics, x, y).fill({ color: 0x314c51, alpha: alpha * .68 });
        for (const angle of lakeShoreAngles(cell, width, height, id => this.cellData.get(id))) {
          this.edge(graphics, x, y, angle).stroke({ color: 0x83968c, width: 1.3, alpha: alpha * .55 });
        }
      } else if (water !== 'land') {
        // Separate original depth marks, not a tint/recolor of the approved ocean tile.
        // Paired pale shelf lines vs a dark-backed triple wave remain distinct without hue.
        const rows = water === 'deep' ? [-7, 0, 7] : [-3, 4];
        for (const offset of rows) {
          graphics.moveTo(x - 12, y + offset).lineTo(x - 6, y + offset - 2).lineTo(x, y + offset).lineTo(x + 6, y + offset - 2).lineTo(x + 12, y + offset).stroke({ color: 0x152b35, width: 4, alpha: alpha * .9 });
          graphics.moveTo(x - 12, y + offset).lineTo(x - 6, y + offset - 2).lineTo(x, y + offset).lineTo(x + 6, y + offset - 2).lineTo(x + 12, y + offset).stroke({ color: water === 'deep' ? 0x718b9a : 0xc0cec0, width: water === 'deep' ? 1.3 : 1.8, alpha });
        }
      } else if (relief === 'hill-ridges') {
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
      // A quiet surface value separates figures from the terrain's fine pixels.
      if (water === 'land' && artFrame) this.hex(graphics, x, y).fill({ color: 0x303a33, alpha: alpha * .24 });
      const district = this.hearthDistricts.get(cell.cell);
      if (district) {
        drawHearthGround(graphics, district, x, y);
        if (!far) {
          for (const adjacent of district.links) {
            const [nx, ny] = this.center(adjacent);
            roads.moveTo(x, y).lineTo((x + nx) / 2, (y + ny) / 2).stroke({ color: 0x403f35, width: 3, alpha: .6 });
            roads.moveTo(x, y).lineTo((x + nx) / 2, (y + ny) / 2).stroke({ color: 0xb2a58a, width: 1.2, alpha: .55 });
            districtStreetSegments++;
          }
          const civic = district.buildingId?.startsWith('building.') && district.kind !== 'construction' ? this.art?.frame(district.buildingId) : undefined;
          if (civic) {
            const fit = this.art!.improvementFit(civic.asset) ?? fitTileArtwork(civic.asset.nativeResolution, civic.asset.pivot, 'improvement');
            const sprite = this.terrainPool.pop() ?? new Sprite(); sprite.texture = civic.texture;
            sprite.anchor.set(civic.asset.pivot[0] / civic.asset.nativeResolution.width, civic.asset.pivot[1] / civic.asset.nativeResolution.height);
            sprite.scale.set(fit.scale); sprite.position.set(x + fit.x, y + fit.y); sprite.alpha = 1;
            sprite.tint = 0xffffff; sprite.roundPixels = true; sprite.visible = true; props.addChild(sprite); sprites.push(sprite);
          } else drawHearthBuilding(buildings, district, x, y);
          if (district.kind === 'housing') {
            const role = selectEntityArt('settlement.village', this.factionDefinitions.get(cell.factionId ?? ''), false, id => this.art?.byContent.has(id) ?? false);
            const frame = role.contentId ? this.art?.frame(role.contentId) : undefined;
            if (frame) {
              const fit = this.art!.settlementFit(frame.asset) ?? fitTileArtwork(frame.asset.nativeResolution, frame.asset.pivot, 'village');
              const sprite = this.terrainPool.pop() ?? new Sprite(); sprite.texture = frame.texture;
              sprite.anchor.set(frame.asset.pivot[0] / frame.asset.nativeResolution.width, frame.asset.pivot[1] / frame.asset.nativeResolution.height);
              sprite.scale.set(fit.scale * .8); sprite.position.set(x + fit.x * .8, y + fit.y * .8);
              sprite.alpha = 1; sprite.tint = 0xffffff; sprite.roundPixels = true; sprite.visible = true;
              props.addChild(sprite); sprites.push(sprite);
            }
          }
        }
      }
      // Improvements occupy worked ground, rather than hovering as isolated icons.
      if (cell.improvementId && water === 'land') {
        this.hex(graphics, x, y, RADIUS - 2).fill({ color: 0x746d50, alpha: alpha * .55 });
        for (const dy of [-14, 14]) graphics.moveTo(x - 13, y + dy + 3).lineTo(x + 13, y + dy - 3).stroke({ color: 0xb2a078, width: 2, alpha: alpha * .65 });
      }
      const connections = geographicConnections(cell, width, height, id => this.cellData.get(id));
      for (const connection of connections.rivers) {
        const curve = riverHalfCurve(cell.cell, connection.neighbor, id => this.center(id));
        const thickness = .65 + connection.size * .7;
        const path = () => rivers.moveTo(...curve.start).bezierCurveTo(...curve.control1, ...curve.control2, ...curve.end);
        path().stroke({ color: 0x26383a, width: thickness + 1.7, alpha: connection.alpha * .9, cap: 'round' });
        path().stroke({ color: 0x637f80, width: thickness, alpha: connection.alpha * .95, cap: 'round' });
        riverSegments++;
      }
      if (!far) for (const connection of connections.roads) {
        const [nx, ny] = this.center(connection.neighbor), mx = (x + nx) / 2, my = (y + ny) / 2;
        roads.moveTo(x, y).lineTo(mx, my).stroke({ color: 0x342c25, width: 5, alpha: connection.alpha, cap: 'round' });
        roads.moveTo(x, y).lineTo(mx, my).stroke({ color: 0xcfb88e, width: 2.6, alpha: connection.alpha, cap: 'round' });
        roadSegments++;
      }
      if (cell.resourceId && !cell.improvementId) {
        const deposit = this.art?.frame(cell.resourceId);
        if (deposit) {
          const fit = this.art!.improvementFit(deposit.asset) ?? fitTileArtwork(deposit.asset.nativeResolution, deposit.asset.pivot, 'improvement');
          // A quiet earthen footing keeps the resource readable against detailed
          // terrain. The approved prop is cached with its explored tile.
          graphics.ellipse(x, y + 5, 18, 8).fill({ color: 0x202b25, alpha: alpha * .72 });
          const sprite = this.terrainPool.pop() ?? new Sprite(); sprite.texture = deposit.texture;
          sprite.anchor.set(deposit.asset.pivot[0] / deposit.asset.nativeResolution.width, deposit.asset.pivot[1] / deposit.asset.nativeResolution.height);
          sprite.scale.set(fit.scale); sprite.position.set(x + fit.x, y + fit.y); sprite.alpha = alpha; sprite.tint = 0xffffff; sprite.roundPixels = true; sprite.visible = true;
          props.addChild(sprite); sprites.push(sprite);
          footprints.push({ cell: cell.cell, contentId: cell.resourceId, assetId: deposit.asset.id, role: 'improvement', presentation: 'approved', bounds: fit.bounds, scale: fit.scale, anchor: { x: fit.x, y: fit.y }, alpha, ...(fit.boundsKind ? { boundsKind: fit.boundsKind, canvasBounds: fit.canvasBounds, horizontalExtent: fit.horizontalExtent, diagonalExtent: fit.diagonalExtent } : {}) });
        }
      }
      if (cell.improvementId) {
        improvementProps++;
        const prop = this.art?.frame(cell.improvementId), glyph = IMPROVEMENT_GLYPHS[cell.improvementId];
        const fit = prop ? this.art!.improvementFit(prop.asset) ?? fitTileArtwork(prop.asset.nativeResolution, prop.asset.pivot, 'improvement') : undefined;
        if (fit || glyph) footprints.push({ cell: cell.cell, contentId: cell.improvementId, assetId: prop?.asset.id ?? null, role: 'improvement', presentation: prop ? 'approved' : 'procedural', bounds: fit?.bounds ?? { ...IMPROVEMENT_GLYPH_BOUNDS }, scale: fit?.scale ?? 1, anchor: { x: fit?.x ?? 0, y: fit?.y ?? 0 }, alpha, ...(fit?.boundsKind ? { boundsKind: fit.boundsKind, canvasBounds: fit.canvasBounds, horizontalExtent: fit.horizontalExtent, diagonalExtent: fit.diagonalExtent } : {}) });
        if (prop && prop.asset.clips.some(clip => clip.state === 'idle' && clip.frames.length > 1)) {
          // Only actual multi-frame approvals leave the static terrain cache.
          // The visible overlay animates them without rebuilding a chunk.
          animatedProps.push({ cell: cell.cell, contentId: cell.improvementId, alpha });
        } else if (prop) {
          const sprite = this.terrainPool.pop() ?? new Sprite(); sprite.texture = prop.texture;
          sprite.anchor.set(prop.asset.pivot[0] / prop.asset.nativeResolution.width, prop.asset.pivot[1] / prop.asset.nativeResolution.height);
          sprite.scale.set(fit!.scale); sprite.position.set(x + fit!.x, y + fit!.y); sprite.alpha = alpha; sprite.visible = true; sprite.roundPixels = true; sprite.tint = 0xffffff;
          props.addChild(sprite); sprites.push(sprite);
        } else if (glyph) {
          missingProps = true;
          graphics.roundRect(x - 11, y - 10, 22, 22, 3).fill({ color: 0x202328, alpha: alpha * .85 });
          if (glyph === 'fields') for (const offset of [-6, 0, 6]) graphics.moveTo(x - 8, y + offset).lineTo(x + 7, y + offset - 3).stroke({ color: 0xdbce95, width: 2, alpha });
          else if (glyph === 'woodlot') graphics.poly([x - 8, y + 5, x, y - 8, x + 8, y + 5]).stroke({ color: 0xdbce95, width: 2, alpha }).moveTo(x, y + 5).lineTo(x, y + 9).stroke({ color: 0xdbce95, width: 2, alpha });
          else if (glyph === 'quarry') graphics.poly([x - 8, y + 7, x - 5, y - 5, x + 5, y - 7, x + 8, y + 7]).stroke({ color: 0xdbce95, width: 2, alpha });
          else if (glyph === 'reeds') for (const offset of [-6, 0, 6]) graphics.moveTo(x + offset, y + 8).lineTo(x + offset, y - 7).moveTo(x + offset, y).lineTo(x + offset + 4, y - 4).stroke({ color: 0xdbce95, width: 2, alpha });
          else if (glyph === 'fishery') graphics.ellipse(x - 2, y, 6, 4).stroke({ color: 0xdbce95, width: 2, alpha }).poly([x + 4, y, x + 9, y - 5, x + 9, y + 5]).stroke({ color: 0xdbce95, width: 2, alpha });
          else drawImprovementGlyph(graphics, glyph, x, y, alpha);
        }
      }
      for (const edge of territoryEdges(cell, width, height, id => this.cellData.get(id), 'realm')) {
        borderEdges++;
        this.edge(borders, x, y, edge.angle).stroke({ color: 0x182323, width: 3.5, alpha: .7 * alpha });
        this.edge(borders, x, y, edge.angle).stroke({ color: this.factionColors.get(edge.factionId) ?? 0xd2c09b, width: 1.6, alpha: alpha * .78 });
      }
    }
    // Empty Graphics include the world origin in bounds: never attach them.
    finishChunkBorders(root, rivers, riverSegments);
    finishChunkBorders(root, roads, roadSegments + districtStreetSegments);
    root.addChild(props);
    if (buildings.context.instructions.length) root.addChild(buildings); else buildings.destroy();
    finishChunkBorders(root, borders, borderEdges);
    // Empty neighbor chunks are deliberately uncached; remove their empty leaf too.
    if (!graphics.context.instructions.length) { graphics.removeFromParent(); graphics.destroy(); }
    const cache = measureChunkCache(root, count);
    if (count) root.cacheAsTexture({ resolution: 1, antialias: false, scaleMode: 'nearest' });
    this.metrics.chunkRebuilds++;
    return { root, count, version: this.chunkVersions.get(key) ?? 0, far, used: this.metrics.frameCount, sprites, animatedProps, footprints, artCells, borderEdges, improvementProps, riverSegments, roadSegments, districtStreetSegments, missingProps, cache };
  }
  private redrawSelection(): void {
    this.selection.clear();
    this.metrics.selectedCells = 0; this.metrics.hoveredCells = 0;
    if (!this.observation) return;
    if (this.hovered !== undefined && this.hovered !== this.selected && this.cellData.has(this.hovered)) {
      const [x, y] = this.center(this.hovered);
      this.hex(this.selection, x, y, RADIUS - 1).stroke({ color: 0xbad7d3, width: 1.3, alpha: .85 });
      this.metrics.hoveredCells = 1;
    }
    if (this.selected === undefined || !this.cellData.has(this.selected)) return;
    this.metrics.selectedCells = 1;
    // Entity selection belongs to its actual visible artwork, not its hex.
    // Empty inspected cells retain a quiet location/overview affordance.
    if (this.selectedEntityId) return;
    const [x, y] = this.center(this.selected);
    if (this.overviewActive) {
      this.selection.circle(x, y, 4 / this.world.scale.x).stroke({ color: 0xffdfa0, width: 1.5 / this.world.scale.x });
      this.metrics.selectedCells = 1; return;
    }
    this.hex(this.selection, x, y, RADIUS - 2).stroke({ color: 0x172324, width: 4.5 });
    this.hex(this.selection, x, y, RADIUS - 2).stroke({ color: 0xffdfa0, width: 2.5 });
    this.metrics.selectedCells = 1;
  }
  private refreshViewport(): void {
    if (!this.observation) return;
    this.metrics.overview = this.overviewActive;
    for (const layer of [this.terrain, this.animatedProps, this.figureGround, this.figures, this.markers, this.labels, this.assetSelection.container, this.movementRange, this.plannedRoute, this.routePreview]) layer.visible = !this.overviewActive;
    if (this.overviewSprite) this.overviewSprite.visible = this.overviewActive;
    if (this.overviewActive) { this.refreshOverview(); return; }
    const zoom = this.world.scale.x, width = this.observation.width, height = this.observation.height;
    const minX = Math.max(0, Math.floor((-this.world.x / zoom / HEX_WIDTH - 2) / CHUNK));
    const maxX = Math.min(Math.ceil(width / CHUNK) - 1, Math.floor(((this.app.screen.width - this.world.x) / zoom / HEX_WIDTH + 2) / CHUNK));
    const minY = Math.max(0, Math.floor((-this.world.y / zoom / ROW_HEIGHT - 2) / CHUNK));
    const maxY = Math.min(Math.ceil(height / CHUNK) - 1, Math.floor(((this.app.screen.height - this.world.y) / zoom / ROW_HEIGHT + 2) / CHUNK));
    const viewportKey = `${minX},${maxX},${minY},${maxY},${zoom < 0.65}`;
    const changed = viewportKey !== this.viewportKey; this.viewportKey = viewportKey;
    const visible = new Set<string>(); let cells = 0, artCells = 0, borderEdges = 0, improvementProps = 0, riverSegments = 0, roadSegments = 0, districtStreetSegments = 0, missingProps = false;
    for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) {
      const key = `${cx},${cy}`;
      if (!this.chunkVersions.has(key)) continue;
      visible.add(key);
      let view = this.chunks.get(key);
      if (view && (view.version !== this.chunkVersions.get(key) || view.far !== (zoom < .65))) { this.destroyChunk(view); view = undefined; }
      if (!view) { view = this.makeChunk(cx, cy, key, zoom < .65); this.chunks.set(key, view); }
      view.root.visible = true; view.used = this.metrics.frameCount; cells += view.count; artCells += view.artCells;
      borderEdges += view.borderEdges; improvementProps += view.improvementProps; missingProps ||= view.missingProps;
      riverSegments += view.riverSegments; roadSegments += view.roadSegments; districtStreetSegments += view.districtStreetSegments;
    }
    for (const [key, view] of this.chunks) if (!visible.has(key)) view.root.visible = false;
    // The retained offscreen cache is bounded, independent of campaign world size.
    if (this.chunks.size > 64) {
      const old = [...this.chunks].filter(([key]) => !visible.has(key)).sort((a, b) => a[1].used - b[1].used);
      for (const [key, view] of old) { if (this.chunks.size <= 64) break; this.destroyChunk(view); this.chunks.delete(key); }
    }
    this.metrics.visibleCells = cells; this.metrics.visibleChunks = visible.size; this.metrics.terrainSpriteCells = artCells;
    this.metrics.riverSegments = riverSegments; this.metrics.roadSegments = roadSegments; this.metrics.districtStreetSegments = districtStreetSegments;
    this.metrics.territoryEdges = borderEdges; this.metrics.improvementProps = improvementProps;
    if (changed || this.markerDirty || this.art) {
      this.markers.clear(); this.labelPool.forEach(label => { label.visible = false; });
      this.figureGround.clear();
      this.markerHitTargets = [];
      this.figurePool.forEach(sprite => { sprite.visible = false; }); this.visibleAnimations = []; this.visibleAssetIds.clear(); this.visibleEntityArt = [];
      this.visibleTileFootprints = [];
      for (const key of visible) for (const footprint of this.chunks.get(key)?.footprints ?? []) {
        const [x, y] = this.center(footprint.cell), sx = x * zoom + this.world.x, sy = y * zoom + this.world.y;
        if (sx >= -RADIUS * zoom && sy >= -RADIUS * zoom && sx <= this.app.screen.width + RADIUS * zoom && sy <= this.app.screen.height + RADIUS * zoom) this.visibleTileFootprints.push(footprint);
      }
      this.animatedPropPool.forEach(sprite => { sprite.visible = false; });
      this.stackBadgePool.forEach(badge => { badge.visible = false; }); this.visibleStackBadges = [];
      const warnings = new Set<string>();
      if (missingProps) warnings.add('Some land improvements lack approved artwork; their distinct procedural glyphs are shown.');
      let entities = 0, figures = 0;
      const selectionTargets: SelectedAssetTarget[] = [];
      let selectionFallback: SelectedFallback | undefined;
      const labelCandidates: MapLabelCandidate[] = [];
      const markerCandidates = [...visible].flatMap(key => this.markerChunks.get(key) ?? []).filter(entity => {
        const [x, y] = this.center(entity.cell), sx = x * zoom + this.world.x, sy = y * zoom + this.world.y;
        return sx >= -100 && sy >= -100 && sx <= this.app.screen.width + 100 && sy <= this.app.screen.height + 100;
      });
      const grouped = groupVisibleMarkers(markerCandidates, this.selectedEntityId);
      const groupsById = new Map(grouped.map(group => [group.representative.id, group]));
      for (const entity of orderVisibleMarkers(grouped.map(group => group.representative), this.selectedEntityId, zoom < .65)) {
        const group = groupsById.get(entity.id)!;
        const [x, y] = this.center(entity.cell), own = entity.factionId === this.observation.factionId;
        const sx = x * zoom + this.world.x, sy = y * zoom + this.world.y;
        entities += group.members.length;
        const hostile = this.enemyFactions.has(entity.factionId);
        const entityOffset = !entity.settlement && !entity.ruin && this.settlementCells.has(entity.cell) ? (zoom < .65 ? 26 / zoom : 16) : 0;
        const labelOffset = entityOffset;
        // Preserve selected stack-member names even when its far badge is aggregated.
        if (sx >= 0 && sy >= 0 && sx < this.app.screen.width && sy < this.app.screen.height) for (const member of group.members) labelCandidates.push({ id: member.id, cell: member.cell, name: member.name, settlement: member.settlement, ruin: member.ruin, own, hostile,
          stackArmyCount: group.armyCount, domain: member.domain, x: sx + labelOffset * zoom, y: sy + (labelOffset + 22) * zoom });
        const far = zoom < .65;
        if (!far && group.armyCount > 1) {
          const index = this.visibleStackBadges.length, text = `×${group.armyCount}`;
          let badge = this.stackBadgePool[index];
          if (!badge) { badge = new Text({ text: '', style: STACK_BADGE_STYLE }); badge.anchor.set(.5); this.labels.addChild(badge); this.stackBadgePool.push(badge); }
          if (badge.text !== text) badge.text = text;
          badge.position.set(x + labelOffset + 17, y + labelOffset + 12); badge.scale.set(1 / zoom); badge.visible = true; badge.roundPixels = true;
          this.visibleStackBadges.push({ cell: entity.cell, factionId: entity.factionId, entityId: entity.id, domain: entity.domain ?? 'land', armies: group.armyCount, text });
        }
        const color = this.factionColors.get(entity.factionId) ?? 0xc9a66b;
        const contentId = entity.ruin ? 'map.ruin' : entity.settlement ? settlementArtRole(entity.population ?? 1) : entity.unitId ?? '';
        const definitionId = this.factionDefinitions.get(entity.factionId);
        const naval = entity.domain === 'naval';
        const selectedArt = selectEntityArt(contentId, definitionId, far, id => this.art?.byContent.has(id) ?? false);
        const artFrame = selectedArt.contentId ? this.art?.frame(selectedArt.contentId) : undefined;
        const selected = entity.id === this.selectedEntityId && !entity.ruin && this.cellData.get(entity.cell)?.visible === true;
        if (entity.settlement && this.observation.land.capitalSettlementId === entity.id) this.markers.poly([x - 5, y - 19, x - 3, y - 23, x, y - 20, x + 3, y - 23, x + 5, y - 19]).stroke({ color: 0xffdfa0, width: 1 });
        if (this.art && selectedArt.warning) warnings.add(selectedArt.warning);
        const formationCount = entity.settlement || entity.ruin ? null : entity.formationCount ?? 1;
        const representatives = armyRepresentatives(formationCount ?? 1, far);
        this.visibleEntityArt.push({ entityId: entity.id, factionId: entity.factionId, definitionId: definitionId ?? null, role: contentId, assetId: artFrame?.asset.id ?? null, presentation: naval && !artFrame ? `procedural-${navalMarker(contentId)}` : selectedArt.presentation, nativeWidth: artFrame?.asset.nativeResolution.width ?? null, nativeHeight: artFrame?.asset.nativeResolution.height ?? null, tint: artFrame ? this.factionTints.get(entity.factionId) ?? 0xffffff : null, formationCount, representativeCount: artFrame ? representatives.length : 1, stackArmyCount: group.armyCount, stackFormationCount: group.formationCount });
        if (artFrame) {
          const baseOffset = entityOffset;
          const bx = x + baseOffset, by = y + baseOffset;
          if (far) {
            const r = 17 / zoom;
            if (entity.settlement) this.figureGround.roundRect(bx - r, by - r, r * 2, r * 2, 3 / zoom).fill({ color: 0x182323, alpha: .94 }).stroke({ color: 0xb9ab8b, width: 1.2 / zoom });
            else this.figureGround.poly([bx - r, by - r, bx + r, by - r, bx + r, by + r * .5, bx, by + r, bx - r, by + r * .5]).fill({ color: 0x182323, alpha: .94 }).stroke({ color, width: 1.4 / zoom });
          } else if (!entity.settlement && !entity.ruin) {
            const r = Math.max(13, Math.min(22, 18 / zoom));
            this.figureGround.ellipse(bx, by + 1, r, r * .48).fill({ color: 0x172324, alpha: .86 }).stroke({ color: own ? 0xc1b597 : color, width: 1.2 / zoom, alpha: .9 });
          }
          const tileRole = tileArtworkRole(contentId);
          const fit = tileRole && !far ? (entity.settlement ? this.art?.settlementFit(artFrame.asset) : undefined) ?? fitTileArtwork(artFrame.asset.nativeResolution, artFrame.asset.pivot, tileRole) : undefined;
          if (fit?.boundsKind === 'canvas') warnings.add(`Settlement silhouette geometry unavailable or changed for ${artFrame.asset.id}; safe padded-canvas sizing is retained.`);
          if (fit) this.visibleTileFootprints.push({ cell: entity.cell, contentId, assetId: artFrame.asset.id, role: tileRole!, presentation: 'approved', bounds: fit.bounds, scale: fit.scale, anchor: { x: fit.x, y: fit.y }, alpha: 1,
            ...(fit.boundsKind ? { boundsKind: fit.boundsKind, canvasBounds: fit.canvasBounds, horizontalExtent: fit.horizontalExtent, diagonalExtent: fit.diagonalExtent } : {}) });
          const offset = entityOffset;
          for (const [index, point] of representatives.entries()) {
            const sprite = this.figurePool[figures] ?? new Sprite();
            if (!this.figurePool[figures]) { this.figures.addChild(sprite); this.figurePool.push(sprite); }
            sprite.texture = artFrame.texture; sprite.anchor.set(artFrame.asset.pivot[0] / artFrame.asset.nativeResolution.width, artFrame.asset.pivot[1] / artFrame.asset.nativeResolution.height);
            sprite.position.set(x + offset + point.x + (fit?.x ?? 0), y + offset + point.y + (fit?.y ?? 0) + (far ? 8 / zoom : 0));
            // Separate uniform figure scale from the terrain's hex fitting.
            if (fit) sprite.scale.set(fit.scale);
            else if (far) sprite.scale.set(strategicSpriteScale(artFrame.asset.nativeResolution.width, artFrame.asset.nativeResolution.height, zoom));
            else sprite.scale.set(armySpriteScale(artFrame.asset.nativeResolution.height, zoom, this.settlementCells.has(entity.cell)));
            const metric = this.visibleEntityArt.at(-1)!; metric.screenWidth = sprite.width * zoom; metric.screenHeight = sprite.height * zoom;
            if (far && !entity.ruin && this.cellData.get(entity.cell)?.visible) {
              const r = 17 / zoom;
              const left = Math.min(bx - r, sprite.x - sprite.anchor.x * sprite.width), top = Math.min(by - r, sprite.y - sprite.anchor.y * sprite.height);
              const right = Math.max(bx + r, sprite.x + (1 - sprite.anchor.x) * sprite.width), bottom = Math.max(by + r, sprite.y + (1 - sprite.anchor.y) * sprite.height);
              this.markerHitTargets.push({ cell: entity.cell, entityId: entity.id, x: left, y: top, width: right - left, height: bottom - top });
            }
            sprite.tint = this.factionTints.get(entity.factionId) ?? 0xffffff; sprite.alpha = 1; sprite.visible = true; sprite.roundPixels = true;
            if (selected) selectionTargets.push({ entityId: entity.id, factionId: entity.factionId, color, sprite });
            this.visibleAssetIds.add(artFrame.asset.id); figures++;
            if (!this.reducedMotion && zoom >= 1.2 && artFrame.asset.clips.some(clip => clip.state === 'idle' && clip.frames.length > 1)) this.visibleAnimations.push({ sprite, contentId: selectedArt.contentId!, phase: Number(entity.id.split('.').at(-1) ?? 0) * 37 + index * 113, frameId: artFrame.frameId });
          }
          // Quiet shape-coded ownership ticks; selected art has its own contour.
          // At far LOD the separately authored badge/banner already identifies the realm.
          if (!far) {
            const by = y + offset + (entity.settlement ? 20 : 8);
            if (own) this.markers.poly([x + offset - 3, by + 2, x + offset, by - 3, x + offset + 3, by + 2]).fill({ color, alpha: .85 });
            else if (hostile) this.markers.moveTo(x + offset - 3, by - 3).lineTo(x + offset + 3, by + 3).moveTo(x + offset + 3, by - 3).lineTo(x + offset - 3, by + 3).stroke({ color, width: 1.7 });
            else this.markers.poly([x + offset, by - 3, x + offset + 3, by, x + offset, by + 3, x + offset - 3, by]).stroke({ color, width: 1.3, alpha: .85 });
          }
        } else if (naval) {
          const scale = far ? .7 / zoom : 1;
          this.markers.save().translateTransform(x, y).scaleTransform(scale, scale);
          this.markers.poly([-17, 4, 17, 4, 10, 13, -9, 13]).fill(0x202328).stroke({ color, width: 2 });
          this.markers.moveTo(0, 4).lineTo(0, -21).stroke({ color: 0xc1b597, width: 2 });
          this.markers.poly([-3, -19, -3, 1, -13, 1]).fill({ color: 0xc1b597, alpha: .95 }).stroke({ color: 0x202328, width: 1 });
          if (navalMarker(contentId) !== 'transport') this.markers.poly([3, -16, 3, 0, 13, 0]).fill(color).stroke({ color: 0x202328, width: 1 });
          if (navalMarker(contentId) === 'ocean-warship') this.markers.moveTo(-12, 7).lineTo(-19, 11).moveTo(12, 7).lineTo(19, 11).stroke({ color: 0xc1b597, width: 2 });
          this.markers.moveTo(-17, 17).lineTo(-8, 15).lineTo(0, 17).lineTo(8, 15).lineTo(17, 17).stroke({ color: 0xa7c4c7, width: 1.5 });
          if (own) this.markers.rect(-3, 7, 6, 3).fill(color);
          else if (hostile) this.markers.moveTo(-4, 6).lineTo(4, 11).moveTo(4, 6).lineTo(-4, 11).stroke({ color, width: 2 });
          else this.markers.poly([0, 5, 4, 8, 0, 11, -4, 8]).stroke({ color, width: 1.5 });
          this.markers.restore();
        } else if (entity.ruin) {
          const fit = fitTileArtwork({ width: 32, height: 28 }, [16, 14], 'ruin');
          this.markers.save().translateTransform(x + fit.x, y + fit.y).scaleTransform(fit.scale, fit.scale);
          this.markers.poly([-12, 10, -12, -9, -6, -3, -2, -7, -2, 10]).fill(0x27302b).stroke({ color: 0xb8aa89, width: 2 });
          this.markers.moveTo(2, 10).lineTo(5, -3).lineTo(11, -8).lineTo(11, 10).stroke({ color: 0xb8aa89, width: 2 });
          this.markers.moveTo(-15, 12).lineTo(15, 12).stroke({ color: 0xb8aa89, width: 1.5 });
          this.markers.restore();
          this.visibleTileFootprints.push({ cell: entity.cell, contentId, assetId: null, role: 'ruin', presentation: 'procedural', bounds: fit.bounds, scale: fit.scale, anchor: { x: fit.x, y: fit.y }, alpha: 1 });
        } else if (entity.settlement) {
          const role = tileArtworkRole(contentId)!;
          const fit = fitTileArtwork({ width: 32, height: 34 }, [16, 22], role);
          this.markers.save().translateTransform(x + fit.x, y + fit.y).scaleTransform(fit.scale, fit.scale);
          this.markers.rect(-9, -7, 18, 17).fill(0x202b2a).stroke({ color, width: 2 });
          const roof = this.markers.poly([-13, -7, 0, -19, 13, -7]);
          if (own) roof.fill(color); else roof.stroke({ color, width: 2 });
          this.markers.restore();
          this.visibleTileFootprints.push({ cell: entity.cell, contentId, assetId: null, role, presentation: 'procedural', bounds: fit.bounds, scale: fit.scale, anchor: { x: fit.x, y: fit.y }, alpha: 1 });
          if (selected) selectionFallback = { entityId: entity.id, factionId: entity.factionId, color, x: x + fit.bounds.x, y: y + fit.bounds.y, width: fit.bounds.width, height: fit.bounds.height };
        } else {
          const offset = this.settlementCells.has(entity.cell) ? 16 : 0;
          this.markers.circle(x + offset, y + offset, 10).fill(0x202b2a).stroke({ color, width: 2 });
          if (own) this.markers.poly([x - 4 + offset, y + 4 + offset, x + offset, y - 5 + offset, x + 4 + offset, y + 4 + offset]).fill(color);
          else if (hostile) this.markers.moveTo(x - 4 + offset, y - 4 + offset).lineTo(x + 4 + offset, y + 4 + offset).moveTo(x + 4 + offset, y - 4 + offset).lineTo(x - 4 + offset, y + 4 + offset).stroke({ color, width: 2 });
          else this.markers.poly([x + offset, y - 5 + offset, x + 4 + offset, y + offset, x + offset, y + 5 + offset, x - 4 + offset, y + offset]).stroke({ color, width: 1.5 });
        }
        if (selected && !artFrame && !entity.settlement) {
          const offset = !entity.settlement && !naval && this.settlementCells.has(entity.cell) ? 16 : 0;
          const scale = naval && far ? .7 / zoom : 1;
          selectionFallback = { entityId: entity.id, factionId: entity.factionId, color,
            x: x + offset - (naval ? 20 : entity.settlement ? 15 : 12) * scale, y: y + offset - (naval ? 23 : entity.settlement ? 21 : 12) * scale,
            width: (naval ? 40 : entity.settlement ? 30 : 24) * scale, height: (naval ? 42 : entity.settlement ? 33 : 24) * scale };
        }
      }
      let dynamicProps = 0;
      for (const key of visible) for (const prop of this.chunks.get(key)?.animatedProps ?? []) {
        const [x, y] = this.center(prop.cell), sx = x * zoom + this.world.x, sy = y * zoom + this.world.y;
        if (sx < -40 || sy < -40 || sx > this.app.screen.width + 40 || sy > this.app.screen.height + 40) continue;
        const frame = this.art?.frame(prop.contentId); if (!frame) continue;
        const fit = this.art!.improvementFit(frame.asset) ?? fitTileArtwork(frame.asset.nativeResolution, frame.asset.pivot, 'improvement');
        let sprite = this.animatedPropPool[dynamicProps++];
        if (!sprite) { sprite = new Sprite(); this.animatedPropPool.push(sprite); this.animatedProps.addChild(sprite); }
        sprite.texture = frame.texture; sprite.anchor.set(frame.asset.pivot[0] / frame.asset.nativeResolution.width, frame.asset.pivot[1] / frame.asset.nativeResolution.height);
        sprite.scale.set(fit.scale); sprite.position.set(x + fit.x, y + fit.y); sprite.alpha = prop.alpha; sprite.visible = true; sprite.roundPixels = true; sprite.tint = 0xffffff;
        this.visibleAssetIds.add(frame.asset.id);
        if (!this.reducedMotion && zoom >= 1.2 && prop.alpha === 1) this.visibleAnimations.push({ sprite, contentId: prop.contentId, phase: prop.cell * 37, frameId: frame.frameId });
      }
      this.assetSelection.set(selectionTargets, selectionFallback, !this.reducedMotion && zoom >= .65);
      this.visibleLabels = layoutMapLabels(labelCandidates, { width: this.app.screen.width, height: this.app.screen.height, zoom, selected: this.selected, selectedEntityId: this.selectedEntityId, hovered: this.hovered }, text => CanvasTextMetrics.measureText(text, MAP_LABEL_STYLE));
      for (const [index, placed] of this.visibleLabels.entries()) {
        let label = this.labelPool[index];
        if (!label) { label = new Text({ text: '', style: MAP_LABEL_STYLE }); label.anchor.set(.5, 0); this.labels.addChild(label); this.labelPool.push(label); }
        if (label.text !== placed.text) label.text = placed.text;
        label.position.set((placed.x - this.world.x) / zoom, (placed.y - this.world.y) / zoom);
        label.scale.set(1 / zoom); label.alpha = placed.priority < 2 ? 1 : .85; label.visible = true; label.roundPixels = true;
      }
      this.metrics.visibleLabels = this.visibleLabels.length;
      const nextWarnings = [...warnings].sort();
      if (nextWarnings.length !== this.visibleArtWarnings.length || nextWarnings.some((warning, index) => warning !== this.visibleArtWarnings[index])) {
        this.visibleArtWarnings = nextWarnings;
        this.onArtStatus?.({ ...this.artStatus, warnings: [...this.artStatus.warnings, ...nextWarnings] });
      }
      this.metrics.visibleEntities = entities; this.metrics.visibleSprites = figures + dynamicProps; this.metrics.stackBadges = this.visibleStackBadges.length; this.metrics.pooledSprites = this.figurePool.length + this.terrainPool.length + this.animatedPropPool.length; this.markerDirty = false;
    }
  }
  private refreshOverview(): void {
    if (!this.observation) return;
    this.assetSelection.clear();
    if (this.overviewDirty || !this.overviewSprite) {
      const raster = worldOverviewPixels(this.observation.width, this.observation.height, this.cellData.values(), { mode: this.overviewMode, factions: this.observation.factions, ...(this.overviewFactionIds ? { factionIds: this.overviewFactionIds } : {}) });
      const canvas = document.createElement('canvas'); canvas.width = raster.width; canvas.height = raster.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('The world overview requires a canvas context.');
      context.putImageData(new ImageData(raster.pixels, raster.width, raster.height), 0, 0);
      const texture = Texture.from(canvas, true); texture.source.scaleMode = 'nearest';
      this.overviewSprite?.removeFromParent(); this.overviewSprite?.destroy(); this.overviewTexture?.destroy(true);
      const sprite = new Sprite(texture); sprite.position.set(-HEX_WIDTH / 2, -ROW_HEIGHT / 2); sprite.scale.set(HEX_WIDTH / 2, ROW_HEIGHT / 2);
      this.world.addChildAt(sprite, 0); this.overviewSprite = sprite; this.overviewTexture = texture; this.overviewDirty = false;
      this.metrics.overviewTextureBytes = raster.pixels.byteLength;
    }
    this.visibleAnimations = []; this.visibleLabels = []; this.visibleEntityArt = []; this.visibleTileFootprints = []; this.visibleStackBadges = []; this.visibleAssetIds.clear();
    this.metrics.visibleCells = this.cellData.size; this.metrics.visibleChunks = 0;
    this.metrics.visibleEntities = 0; this.metrics.visibleLabels = 0; this.metrics.visibleSprites = 1; this.metrics.stackBadges = 0;
    this.metrics.terrainSpriteCells = 0; this.metrics.riverSegments = 0; this.metrics.roadSegments = 0; this.metrics.districtStreetSegments = 0; this.metrics.territoryEdges = 0; this.metrics.improvementProps = 0;
  }
  private tick = (time: number): void => {
    if (this.disposed) return;
    const started = performance.now();
    if (this.battlefield.active) this.battlefield.tick(time, this.art, this.reducedMotion, document.hidden);
    else {
      if (this.cameraDirty) { this.refreshViewport(); this.cameraDirty = false; }
      if (!document.hidden) for (const animation of this.visibleAnimations) { const frame = this.art?.frame(animation.contentId, time + animation.phase, true); if (frame && animation.sprite.texture !== frame.texture) { animation.sprite.texture = frame.texture; animation.frameId = frame.frameId; } }
      if (!document.hidden) this.assetSelection.tick(time);
    }
    this.app.render();
    this.metrics.renderCpuMs = performance.now() - started;
    if (this.art && this.metrics.artFirstRenderCpuMs < 0) this.metrics.artFirstRenderCpuMs = this.metrics.renderCpuMs;
    this.metrics.frameCount++;
    if (this.previousFrame && !document.hidden) { const elapsed = time - this.previousFrame; this.metrics.frameMs = elapsed; this.samples.push(elapsed); if (this.samples.length > 240) this.samples.shift(); }
    this.previousFrame = time;
    this.frame = requestAnimationFrame(this.tick);
  };
}
