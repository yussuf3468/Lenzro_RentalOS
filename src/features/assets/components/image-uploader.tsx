import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { toMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import * as api from '../api/assets.api';
import { type AssetImage } from '../schemas/asset.schema';

interface ImageUploaderProps {
  assetId: string;
  organizationId: string;
  primaryPath: string | null;
}

export function ImageUploader({ assetId, organizationId, primaryPath }: ImageUploaderProps) {
  const [images, setImages] = useState<AssetImage[]>([]);
  const [primary, setPrimary] = useState<string | null>(primaryPath);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void api
      .fetchAssetImages(assetId)
      .then((rows) => {
        if (active) setImages(rows);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [assetId]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      let sort = images.length;
      const added: AssetImage[] = [];
      for (const file of Array.from(files)) {
        const path = await api.uploadAssetImage(organizationId, file);
        const row = await api.addAssetImage(assetId, path, sort);
        sort += 1;
        added.push(row);
      }
      const next = [...images, ...added];
      setImages(next);
      if (!primary && next.length > 0) {
        await api.setPrimaryImage(assetId, next[0].path);
        setPrimary(next[0].path);
      }
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (image: AssetImage) => {
    setError(null);
    try {
      await api.removeAssetImage(image);
      const next = images.filter((item) => item.id !== image.id);
      setImages(next);
      if (primary === image.path) {
        const nextPrimary = next[0]?.path ?? null;
        await api.setPrimaryImage(assetId, nextPrimary);
        setPrimary(nextPrimary);
      }
    } catch (err) {
      setError(toMessage(err));
    }
  };

  const makePrimary = async (image: AssetImage) => {
    setError(null);
    try {
      await api.setPrimaryImage(assetId, image.path);
      setPrimary(image.path);
    } catch (err) {
      setError(toMessage(err));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              'group/img relative size-24 overflow-hidden rounded-lg border',
              primary === image.path ? 'border-primary ring-2 ring-primary/30' : 'border-border',
            )}
          >
            <img src={api.imageUrl(image.path) ?? ''} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover/img:opacity-100">
              <button
                type="button"
                onClick={() => makePrimary(image)}
                className="rounded-md bg-white/15 p-1.5 text-white hover:bg-white/25"
                aria-label="Set as primary photo"
              >
                <Star className={cn('size-4', primary === image.path && 'fill-current')} />
              </button>
              <button
                type="button"
                onClick={() => remove(image)}
                className="rounded-md bg-white/15 p-1.5 text-white hover:bg-destructive"
                aria-label="Remove photo"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          <span className="text-[11px]">{busy ? 'Uploading' : 'Add'}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => onFiles(event.target.files)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
