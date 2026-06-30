import { motion, useScroll } from 'framer-motion';
import { Aurora } from './components/aurora';
import { MarketingFooter } from './components/marketing-footer';
import { MarketingNav } from './components/marketing-nav';
import { usePointer } from './hooks/use-pointer';
import { Architecture } from './sections/architecture';
import { Close } from './sections/close';
import { Overture } from './sections/overture';
import { Pulse } from './sections/pulse';
import { Reach } from './sections/reach';
import { System } from './sections/system';

export function LandingPage() {
  const pointer = usePointer();
  const { scrollYProgress } = useScroll();

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#050609] text-white">
      {/* Scroll progress */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-brand"
      />

      <Aurora x={pointer.x} y={pointer.y} />
      <MarketingNav />

      <div className="relative z-10">
        <main>
          <Overture pointer={pointer} />
          <Pulse />
          <System />
          <Reach />
          <Architecture />
          <Close />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
