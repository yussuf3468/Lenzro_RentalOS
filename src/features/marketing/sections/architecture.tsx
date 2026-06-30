import { Lock } from 'lucide-react';
import { Chip, Eyebrow, Reveal, StatusDot } from '../components/primitives';

function TenantPanel({
  name,
  org,
  tone,
  plates,
}: {
  name: string;
  org: string;
  tone: 'green' | 'amber';
  plates: string[];
}) {
  return (
    <div className="bg-white/[0.02] p-5">
      <div className="flex items-center gap-2">
        <StatusDot tone={tone} />
        <span className="font-mono text-xs text-white/75">{name}</span>
      </div>
      <div className="mt-4 space-y-2.5">
        {plates.map((plate) => (
          <div key={plate} className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/40">{plate}</span>
            <span className="h-1.5 w-16 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] text-white/25">org_id · {org}</p>
    </div>
  );
}

function IsolationDiagram() {
  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <TenantPanel
          name="Acme Rentals"
          org="8f3a…"
          tone="green"
          plates={['KDA 482J', 'KCY 119X', 'KDG 770M']}
        />
        <TenantPanel
          name="Savanna Fleet"
          org="1b9c…"
          tone="amber"
          plates={['GE 204 KLA', 'GE 661 KLA', 'GE 318 KLA']}
        />
      </div>
      <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#00FF99]/60 to-transparent" />
      <div className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0b1018] text-[#34f5b0]">
        <Lock className="size-4" />
      </div>
    </div>
  );
}

export function Architecture() {
  return (
    <section className="relative px-6 py-28 md:py-40">
      <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
        <Reveal>
          <Eyebrow>Architecture</Eyebrow>
          <h2 className="mt-5 text-[clamp(2rem,5vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.02em] text-white">
            Every company,
            <br />
            <span className="text-gradient-brand">its own universe.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-white/55">
            Isolation isn’t a checkbox you can forget. Lenzro enforces it in the database itself —
            one company can never see another’s data, even if the application is wrong.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Chip>Row-Level Security</Chip>
            <Chip>JWT-scoped tenancy</Chip>
            <Chip>Zero shared rows</Chip>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <IsolationDiagram />
        </Reveal>
      </div>
    </section>
  );
}
