"use client";

export function VeilPayLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(220,251,245,0.96))] text-[var(--ink)] shadow-[0_16px_36px_rgba(25,182,162,0.18)]"
      style={{ width: size, height: size }}
      aria-label="VeilPay"
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),transparent_38%),radial-gradient(circle_at_72%_72%,rgba(25,182,162,0.18),transparent_52%)]" />
      <svg
        className="relative"
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7c3.5 6 12.5 6 16 0" />
        <path d="M6 7v6c0 3.3 3 6 6 6s6-2.7 6-6V7" />
        <path d="M9 12h6" />
      </svg>
    </div>
  );
}
