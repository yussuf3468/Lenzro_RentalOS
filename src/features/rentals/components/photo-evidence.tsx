import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toMessage } from '@/lib/errors';
import { signedPhotoUrl } from '../api/rentals.api';
import { useDeleteRentalPhoto, useUploadRentalPhoto } from '../hooks/use-rentals';
import { type RentalPhoto } from '../schemas/rental.schema';

/** Signed-URL thumbnail for one evidence photo. */
function PhotoThumb({ photo, onRemove }: { photo: RentalPhoto; onRemove?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void signedPhotoUrl(photo.path).then((next) => {
      if (active) setUrl(next);
    });
    return () => {
      active = false;
    };
  }, [photo.path]);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/5">
      {url ? (
        <img src={url} alt={photo.slot} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white capitalize">
        {photo.slot}
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${photo.slot} photo`}
          className="absolute top-1.5 right-1.5 rounded-md bg-black/55 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** Read-only gallery (e.g. "at pickup" photos shown during the return). */
export function PhotoStrip({ photos }: { photos: RentalPhoto[] }) {
  if (photos.length === 0) {
    return <p className="text-xs text-muted-foreground">No photos were taken.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {photos.map((photo) => (
        <PhotoThumb key={photo.id} photo={photo} />
      ))}
    </div>
  );
}

const GUIDED_SLOTS = ['front', 'back', 'left', 'right', 'dashboard'] as const;

interface PhotoCaptureGridProps {
  organizationId: string;
  rentalId: string;
  phase: 'checkout' | 'return';
  photos: RentalPhoto[];
}

/** Guided walk-around capture: one tile per angle + extras. Camera-first on phones. */
export function PhotoCaptureGrid({
  organizationId,
  rentalId,
  phase,
  photos,
}: PhotoCaptureGridProps) {
  const upload = useUploadRentalPhoto();
  const remove = useDeleteRentalPhoto();
  const [error, setError] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<string>('extra');

  const capture = (slot: string) => {
    pendingSlot.current = slot;
    inputRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const slot = pendingSlot.current;
    setBusySlot(slot);
    setError(null);
    try {
      await upload.mutateAsync({ organizationId, rentalId, phase, slot, file });
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusySlot(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const bySlot = (slot: string) =>
    photos.filter((photo) => photo.phase === phase && photo.slot === slot);
  const extras = bySlot('extra');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {GUIDED_SLOTS.map((slot) => {
          const existing = bySlot(slot)[0];
          if (existing) {
            return (
              <PhotoThumb key={slot} photo={existing} onRemove={() => remove.mutate(existing)} />
            );
          }
          return (
            <button
              key={slot}
              type="button"
              onClick={() => capture(slot)}
              disabled={busySlot !== null}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {busySlot === slot ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              <span className="text-[10px] font-medium capitalize">{slot}</span>
            </button>
          );
        })}
      </div>

      {extras.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {extras.map((photo) => (
            <PhotoThumb key={photo.id} photo={photo} onRemove={() => remove.mutate(photo)} />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => capture('extra')}
        disabled={busySlot !== null}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
      >
        <Camera className="size-3.5" />
        {busySlot === 'extra' ? 'Uploading…' : 'Add photo (scratch, dent, detail…)'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
