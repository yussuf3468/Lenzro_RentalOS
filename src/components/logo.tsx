import { cn } from '@/lib/utils';

// Master mark path — mirrors /assets/logo.svg. Do not fork; keep in sync with the asset.
const MARK_PATH =
  'M30.4742 3.63054C32.2745 -0.200807 37.7245 -0.200598 39.525 3.63054L59.1031 45.2966L69.1168 66.6071C70.9745 70.5607 67.2249 74.8291 63.065 73.4958L34.9996 64.4997L6.93417 73.4958C2.77451 74.8285 -0.974254 70.5606 0.883392 66.6071L10.8971 45.2966L30.4742 3.63054ZM39.5289 25.6745C37.7313 21.8341 32.2689 21.8341 30.4713 25.6745L21.4029 45.0475L17.8658 52.6051C16.0143 56.5607 19.7678 60.8226 23.9254 59.485L34.9996 55.9216L46.0748 59.485C50.2323 60.8225 53.9859 56.5607 52.1344 52.6051L48.5963 45.0475L39.5289 25.6745Z';

interface LogoMarkProps {
  className?: string;
}

/** The gradient brand mark only. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 70 74" role="img" aria-label="Lenzro" className={cn('h-8 w-auto', className)}>
      <title>Lenzro</title>
      <defs>
        <linearGradient
          id="lenzroBrandGrad"
          x1="65.853"
          y1="0.7575"
          x2="-1.985"
          y2="69.3275"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.5" stopColor="#FBEB05" />
          <stop offset="1" stopColor="#00FF99" />
        </linearGradient>
      </defs>
      <path d={MARK_PATH} fill="url(#lenzroBrandGrad)" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  gradientWordmark?: boolean;
}

/** Full lockup: mark + "Lenzro / RentalOS" wordmark. */
export function Logo({ className, showWordmark = true, gradientWordmark = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="h-7 w-auto" />
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'text-base font-bold tracking-tight',
              gradientWordmark && 'text-gradient-brand',
            )}
          >
            Lenzro
          </span>
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
            RentalOS
          </span>
        </span>
      ) : null}
    </span>
  );
}
