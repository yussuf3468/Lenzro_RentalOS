/**
 * The ambient light layer behind the OS shell — two soft, corner-pinned brand
 * blooms plus a grain layer that dithers the gradients (prevents banding and
 * per-panel tint mismatch on large / budget displays). GPU-only, decorative.
 * The global `prefers-reduced-motion` rule in globals.css freezes the drift.
 */
export function AmbientCanvas() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[24%] -left-[10%] size-[44rem] animate-[aurora-drift-1_28s_ease-in-out_infinite] rounded-full blur-[160px] will-change-transform"
        style={{
          background:
            'radial-gradient(circle at center, rgb(var(--os-glow-a) / var(--os-glow-strength)), transparent 62%)',
        }}
      />
      <div
        className="absolute -right-[14%] -bottom-[22%] size-[40rem] animate-[aurora-drift-2_32s_ease-in-out_infinite] rounded-full blur-[170px] will-change-transform"
        style={{
          background:
            'radial-gradient(circle at center, rgb(var(--os-glow-b) / var(--os-glow-strength)), transparent 62%)',
        }}
      />
      {/* Grain dither — breaks up gradient banding on 6-bit/FRC panels. */}
      <div className="absolute inset-0 bg-grain opacity-[0.04] mix-blend-overlay" />
    </div>
  );
}
