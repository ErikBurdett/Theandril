import { useEffect, useRef, useState } from 'react';
import { loadArtImageBytes, type ArtImageExpectation } from './art-image';

export interface PreviewFrame {
  id: string; rect: { x: number; y: number; w: number; h: number };
  native: { w: number; h: number }; trim: { x: number; y: number };
  pivot: { x: number; y: number };
}
export interface PixelInspection { opaque: number; transparent: number; partialAlpha: number; colors: string[]; colorCount: number; bounds: { x: number; y: number; w: number; h: number } | null }
export type AlphaBackground = 'checker' | 'light' | 'dark' | 'magenta';

export function useAtlasImage(url: string | undefined, expected?: ArtImageExpectation) {
  const [image, setImage] = useState<HTMLImageElement>();
  const [error, setError] = useState('');
  useEffect(() => {
    setImage(undefined); setError('');
    if (!url) return;
    const controller = new AbortController(); let blobUrl: string | undefined;
    void (async () => {
      try {
        const data = await loadArtImageBytes(url, controller.signal, expected);
        if (controller.signal.aborted) return;
        blobUrl = URL.createObjectURL(new Blob([data.bytes], { type: 'image/png' }));
        const next = new Image(); next.src = blobUrl; await next.decode();
        if (next.naturalWidth !== data.width || next.naturalHeight !== data.height) throw new Error('Decoded art dimensions do not match the PNG header. Preview withheld.');
        if (!controller.signal.aborted) setImage(next);
      } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : String(failure)); }
    })();
    return () => { controller.abort(); if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [url, expected?.width, expected?.height, expected?.sha256]);
  return { image, error };
}

/** Read exact displayed frame pixels. This inspector never modifies source assets. */
export function inspectPixels(image: HTMLImageElement, frame: PreviewFrame): PixelInspection {
  const canvas = document.createElement('canvas'); canvas.width = frame.native.w; canvas.height = frame.native.h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Pixel inspection requires a 2D canvas context.');
  ctx.imageSmoothingEnabled = false;
  const r = frame.rect; ctx.drawImage(image, r.x, r.y, r.w, r.h, frame.trim.x, frame.trim.y, r.w, r.h);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let opaque = 0, transparent = 0, partialAlpha = 0, left = canvas.width, top = canvas.height, right = -1, bottom = -1;
  const colors = new Set<string>();
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]!;
    if (!alpha) { transparent++; continue; }
    if (alpha === 255) opaque++; else partialAlpha++;
    colors.add('#' + [...data.slice(i, i + 3)].map(value => value.toString(16).padStart(2, '0')).join(''));
    const pixel = i / 4, x = pixel % canvas.width, y = Math.floor(pixel / canvas.width);
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  return { opaque, transparent, partialAlpha, colors: [...colors].sort().slice(0, 256), colorCount: colors.size, bounds: right < 0 ? null : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 } };
}

function background(ctx: CanvasRenderingContext2D, width: number, height: number, value: AlphaBackground): void {
  ctx.fillStyle = value === 'light' ? '#eee8d7' : value === 'magenta' ? '#842662' : '#142019';
  ctx.fillRect(0, 0, width, height);
  if (value === 'checker') for (let y = 0; y < height; y += 16) for (let x = 0; x < width; x += 16) {
    ctx.fillStyle = (x / 16 + y / 16) % 2 ? '#2c3734' : '#52605a'; ctx.fillRect(x, y, 16, 16);
  }
}

export function ArtPreview({ image, frame, zoom, alpha, showPivot, showBounds, inspection, repeat }: {
  image: HTMLImageElement; frame: PreviewFrame; zoom: number; alpha: AlphaBackground;
  showPivot: boolean; showBounds: boolean; inspection?: PixelInspection; repeat: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = (repeat ? 56 * 5 + 36 : frame.native.w) * zoom;
  const height = (repeat ? 48 * 4 + 64 : frame.native.h) * zoom;
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    ctx.imageSmoothingEnabled = false; background(ctx, width, height, alpha);
    const r = frame.rect;
    const draw = (x: number, y: number) => ctx.drawImage(image, r.x, r.y, r.w, r.h, (x + frame.trim.x) * zoom, (y + frame.trim.y) * zoom, r.w * zoom, r.h * zoom);
    if (repeat) for (let row = 0; row < 5; row++) for (let column = 0; column < 5; column++) draw(column * 56 + (row % 2) * 28, row * 48);
    else {
      draw(0, 0);
      if (showBounds && inspection?.bounds) { const b = inspection.bounds; ctx.strokeStyle = '#77edc4'; ctx.lineWidth = 1; ctx.strokeRect(b.x * zoom + .5, b.y * zoom + .5, b.w * zoom - 1, b.h * zoom - 1); }
      if (showPivot) {
        const x = frame.pivot.x * zoom, y = frame.pivot.y * zoom;
        ctx.strokeStyle = '#ffc66e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 10, y + .5); ctx.lineTo(x + 10, y + .5); ctx.moveTo(x + .5, y - 10); ctx.lineTo(x + .5, y + 10); ctx.stroke();
      }
    }
  }, [image, frame, zoom, alpha, showPivot, showBounds, inspection, repeat, width, height]);
  return <div className="art-canvas-scroll" tabIndex={0} aria-label={repeat ? 'Scrollable terrain repeat preview' : 'Scrollable native pixel preview'}><canvas ref={canvas} width={width} height={height} data-testid={repeat ? 'art-repeat-canvas' : 'art-preview-canvas'} role="img" aria-label={`${frame.id}, ${zoom} times native pixels${repeat ? ', five by five pointy hex repetition' : ''}`}/></div>;
}

export function AtlasPreview({ image, frames, selected, showAll }: { image: HTMLImageElement; frames: PreviewFrame[]; selected: string; showAll: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    ctx.imageSmoothingEnabled = false; background(ctx, image.width, image.height, 'checker'); ctx.drawImage(image, 0, 0);
    for (const frame of frames) if (showAll || frame.id === selected) {
      const r = frame.rect; ctx.strokeStyle = frame.id === selected ? '#ffe09a' : '#72c5a1'; ctx.lineWidth = frame.id === selected ? 2 : 1;
      ctx.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1);
    }
  }, [image, frames, selected, showAll]);
  return <div className="art-canvas-scroll" tabIndex={0} aria-label="Scrollable atlas rectangles"><canvas ref={canvas} width={image.width} height={image.height} role="img" aria-label={`Atlas ${image.width} by ${image.height}; selected rectangle ${selected}`} data-testid="art-atlas-canvas"/></div>;
}
