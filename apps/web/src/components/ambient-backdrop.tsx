"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function AmbientBackdrop() {
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(35);

  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 18, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 18, mass: 0.5 });

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      mouseX.set((event.clientX / width) * 100);
      mouseY.set((event.clientY / height) * 100);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [mouseX, mouseY]);

  const interactiveGlow = useMotionTemplate`radial-gradient(circle at ${smoothX}% ${smoothY}%, rgba(25,182,162,0.24), rgba(125,231,215,0.12) 16%, transparent 34%)`;
  const interactiveSpark = useMotionTemplate`radial-gradient(circle at ${smoothX}% ${smoothY}%, rgba(255,255,255,0.9), rgba(255,255,255,0.14) 7%, transparent 14%)`;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(125,231,215,0.85),rgba(125,231,215,0.14)_48%,transparent_70%)] blur-2xl"
        animate={{
          x: [0, 24, -10, 0],
          y: [0, 30, 10, 0],
          scale: [1, 1.08, 0.98, 1],
        }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-4rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(25,182,162,0.42),rgba(16,58,83,0.12)_54%,transparent_72%)] blur-3xl"
        animate={{
          x: [0, -36, 8, 0],
          y: [0, 18, -16, 0],
          scale: [1, 0.94, 1.06, 1],
        }}
        transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-8rem] left-1/3 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(16,58,83,0.22),rgba(16,58,83,0.06)_48%,transparent_72%)] blur-3xl"
        animate={{
          x: [0, 18, -22, 0],
          y: [0, -14, 18, 0],
          rotate: [0, 6, -4, 0],
        }}
        transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div className="absolute inset-0 opacity-90" style={{ background: interactiveGlow }} />
      <motion.div className="absolute inset-0 opacity-80 blur-[1px]" style={{ background: interactiveSpark }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.66),transparent_18%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.42),transparent_16%),linear-gradient(180deg,transparent,rgba(255,255,255,0.18))]" />
    </div>
  );
}
