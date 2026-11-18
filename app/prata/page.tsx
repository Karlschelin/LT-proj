"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SCENARIOS } from "@/lib/scenarios";

export default function PrataPage() {
  return (
    <AppShell>
      <section className="view pad">
        <div>
          <h1 className="title-xl">Prata</h1>
          <p className="sub">Välj en situation. Du får rättelser på svenska efter varje svar.</p>
        </div>
        <div className="scen-grid">
          {SCENARIOS.map((s) => (
            <Link key={s.id} href={`/practice?scenario=${s.id}`} className="scen">
              <span className="e">{s.emoji}</span>
              <strong>{s.title}</strong>
              <span>{s.subtitle}</span>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
