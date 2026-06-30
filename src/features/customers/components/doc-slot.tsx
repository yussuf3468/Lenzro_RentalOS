import { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toMessage } from '@/lib/errors';
import * as api from '../api/customers.api';
import { type DocKind } from '../api/customers.api';

interface DocSlotProps {
  customerId: string;
  organizationId: string;
  kind: DocKind;
  label: string;
  initialPath: string | null;
}

export function DocSlot({ customerId, kind, label, initialPath, organizationId }: DocSlotProps) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!path) return;
    let active = true;
    void api.signedDocUrl(path).then((next) => {
      if (active) setUrl(next);
    });
    return () => {
      active = false;
    };
  }, [path]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const previous = path;
      const newPath = await api.uploadCustomerDoc(organizationId, customerId, kind, file);
      await api.setCustomerDoc(customerId, kind, newPath);
      if (previous) await api.removeStoredDoc(previous).catch(() => {});
      setUrl(null);
      setPath(newPath);
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!path) return;
    setError(null);
    try {
      await api.removeStoredDoc(path).catch(() => {});
      await api.setCustomerDoc(customerId, kind, null);
      setPath(null);
    } catch (err) {
      setError(toMessage(err));
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {path ? (
        <div className="group relative aspect-[3/2] overflow-hidden rounded-lg border border-border bg-muted">
          {url ? (
            <img src={url} alt={label} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 rounded-md bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          <span className="text-[11px]">{busy ? 'Uploading' : 'Upload'}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
