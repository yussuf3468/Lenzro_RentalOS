import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, Eraser, Loader2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toMessage } from '@/lib/errors';

interface SignaturePadProps {
  /** Called with the drawn signature as a PNG blob. Resolve = saved. */
  onSave: (blob: Blob) => Promise<void>;
  /** True once a signature already exists for this phase. */
  saved: boolean;
}

/**
 * Finger/stylus signature capture. White background on purpose — the signature
 * is printed on the (light) contract document.
 */
export function SignaturePad({ onSave, saved }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scale the canvas for crisp strokes on high-DPI screens.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#11151f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const onUp = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasInk(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    setBusy(true);
    setError(null);
    canvas.toBlob((blob) => {
      if (!blob) {
        setBusy(false);
        return;
      }
      onSave(blob)
        .then(() => clear())
        .catch((err) => setError(toMessage(err)))
        .finally(() => setBusy(false));
    }, 'image/png');
  };

  return (
    <div className="space-y-2">
      {saved ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-success">
          <Check className="size-3.5" /> Signature saved
        </p>
      ) : null}
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        aria-label="Signature area — draw with your finger or mouse"
        className="h-36 w-full touch-none rounded-xl border border-white/15 bg-white"
      />
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk || busy}>
          <Eraser /> Clear
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={!hasInk || busy}>
          {busy ? <Loader2 className="animate-spin" /> : <PenLine />}
          {busy ? 'Saving…' : saved ? 'Save new signature' : 'Save signature'}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
