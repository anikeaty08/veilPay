"use client";

export function VeilPayLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--ink)] shadow-[0_12px_24px_rgba(24,183,161,0.25)]"
      style={{ width: size, height: size }}
      aria-label="VeilPay"
    >
      <svg
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
