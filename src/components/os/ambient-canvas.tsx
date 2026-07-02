/**
 * The ambient light layer behind the OS shell — soft, brand-tinted radial blooms
 * that drift slowly. GPU-only (transform/opacity), low opacity, decorative. The
 * global `prefers-reduced-motion` rule in globals.css freezes the drift.
 */
export function AmbientCanvas() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[18%] left-[4%] size-[44rem] animate-[aurora-drift-1_24s_ease-in-out_infinite] rounded-full blur-[140px] will-change-transform"
        style={{
          background:
            'radial-gradient(circle at center, rgb(var(--os-glow-a) / var(--os-glow-strength)), transparent 68%)',
        }}
      />
      <div
        className="absolute -right-[10%] bottom-[-12%] size-[40rem] animate-[aurora-drift-2_28s_ease-in-out_infinite] rounded-full blur-[150px] will-change-transform"
        style={{
          background:
            'radial-gradient(circle at center, rgb(var(--os-glow-b) / var(--os-glow-strength)), transparent 68%)',
        }}
      />
      <div
        className="absolute top-[30%] right-[26%] size-[26rem] animate-[aurora-drift-3_32s_ease-in-out_infinite] rounded-full blur-[130px] will-change-transform"
        style={{
          background:
            'radial-gradient(circle at center, rgb(var(--os-glow-a) / calc(var(--os-glow-strength) * 0.6)), transparent 70%)',
        }}
      />
    </div>
  );
}
