import { useRef } from 'react';
import { evidenceUrl, localUrl } from './journal';
import provenance from './media.json';
const base = import.meta.env.BASE_URL;
export function Illustration({ id, eager = false }: { id: string; eager?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null); const image = provenance.assets.find(asset => asset.id === id); if (!image) return null;
  return <figure className={`illustration illustration-${id}`}><button className="image-mat" type="button" aria-label={`Enlarge ${id} image`} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><img src={localUrl(base, image.path)} alt={image.alt} width={image.width} height={image.height} loading={eager ? 'eager' : 'lazy'} /><span className="enlarge-hint" aria-hidden="true">Inspect image ↗</span></button><figcaption>{image.caption} <a href={evidenceUrl(image.sourcePath, image.sourceRevision)}>Original image ↗</a></figcaption><dialog ref={dialog} className="image-dialog" aria-label="Image detail" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="dialog-toolbar"><span>From the development record</span><button type="button" autoFocus onClick={() => dialog.current?.close()}>Close image</button></div><img src={localUrl(base, image.path)} alt={image.alt} width={image.width} height={image.height} loading="lazy" /><p>{image.caption}</p><a href={evidenceUrl(image.sourcePath, image.sourceRevision)}>View the complete source screenshot ↗</a></dialog></figure>;
}
