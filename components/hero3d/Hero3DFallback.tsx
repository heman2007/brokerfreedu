import Link from "next/link";
import type { NavItem } from "./nav";

export default function Hero3DFallback({ nav }: { nav: NavItem[] }) {
  return (
    <section className="border-b border-rule py-20">
      <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">
        <div>
          <p className="eyebrow mb-4">A free, DU-only housing board</p>
          <h1 className="font-serif text-[clamp(34px,6vw,58px)] leading-[1.08] tracking-tight font-medium mb-6">
            The person moving out
            <br />
            knows first.
          </h1>
          <p className="text-[17px] text-soft max-w-[52ch] leading-relaxed mb-8">
            Brokers around DU charge half a month&apos;s rent for one piece of information: which
            flat is about to be empty. Students already have it.
          </p>
          <div className="flex flex-wrap gap-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.accent ? "btn-red px-5 py-2.5 text-[13.5px] font-semibold" : "btn-ghost px-5 py-2.5 text-[13.5px] font-semibold"}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {/* A flat, static illustration standing in for the 3D scene */}
        <svg viewBox="0 0 400 280" className="w-full h-auto" role="img" aria-label="Illustration of a colonial-style university building with an arched entrance">
          <rect width="400" height="280" fill="var(--paper)" />
          <rect x="40" y="90" width="320" height="150" fill="#9a4a33" />
          <rect x="40" y="80" width="320" height="14" fill="#eadfc7" />
          <path d="M150 240 V150 A50 50 0 0 1 250 150 V240 Z" fill="#17181a" />
          <path d="M150 240 V150 A50 50 0 0 1 250 150 V240" fill="none" stroke="#eadfc7" strokeWidth="6" />
          <circle cx="90" cy="150" r="18" fill="#eadfc7" opacity="0.9" />
          <circle cx="310" cy="150" r="18" fill="#eadfc7" opacity="0.9" />
          <rect x="30" y="236" width="340" height="10" fill="#cdbd98" />
        </svg>
      </div>
    </section>
  );
}
