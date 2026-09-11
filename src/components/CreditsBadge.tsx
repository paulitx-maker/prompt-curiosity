import { useEffect, useState } from "react";

type Props = {
  credits?: number;
  usedToday?: number;
  limitToday?: number;
  deviceId?: string;
};

function getStoredDeviceId(): string {
  try {
    return localStorage.getItem("device_id") || "web";
  } catch {
    return "web";
  }
}

export function CreditsBadge({ credits: initialCredits = 3, usedToday = 0, limitToday = 10, deviceId }: Props) {
  const [credits, setCredits] = useState<number>(() => {
    // Leitura síncrona inicial do localStorage pra não piscar, mas será corrigida pelo fetch do banco
    try {
      const saved = localStorage.getItem("credits");
      if (saved) {
        const n = parseInt(saved);
        if (!isNaN(n)) return n;
      }
    } catch {}
    return initialCredits;
  });

  useEffect(() => {
    const id = deviceId || getStoredDeviceId();

    const fetchRealCredits = async () => {
      try {
        // tenta 2 caminhos possíveis do client
        let supabase: any = null;
        try {
          const mod = await import("@/integrations/supabase/client");
          supabase = mod.supabase || mod.default?.supabase;
          if (mod.createClient) supabase = mod.createClient();
        } catch {}
        if (!supabase) {
          try {
            const mod2 = await import("@/lib/supabase");
            supabase = mod2.supabase || mod2.default;
          } catch {}
        }
        if (supabase) {
          const { data } = await supabase.from("users").select("credits, creditos").eq("device_id", id).single();
          if (data) {
            const real = (data.credits ?? data.creditos ?? initialCredits) as number;
            setCredits(real);
            try { localStorage.setItem("credits", String(real)); } catch {}
            return;
          }
        }
      } catch {}
      // fallback mantém prop
    };

    fetchRealCredits();

    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail && typeof ce.detail.credits === "number") {
        setCredits(ce.detail.credits);
        try { localStorage.setItem("credits", String(ce.detail.credits)); } catch {}
      } else if (ce.detail && typeof ce.detail.delta === "number") {
        // só aplica delta se o fetch real já aconteceu, senão espera fetch
        setCredits((prev) => {
          const next = Math.max(0, prev + ce.detail.delta);
          try { localStorage.setItem("credits", String(next)); } catch {}
          return next;
        });
      }
    };

    window.addEventListener("credits-updated" as any, handler);
    return () => window.removeEventListener("credits-updated" as any, handler);
  }, [deviceId, initialCredits]);

  return (
    <div className="inline-flex items-center rounded-full bg-[#FF6B00]/90 backdrop-blur border border-[#FF6B00]/20 px-[16px] py-[8px] shadow-[0_2px_12px_rgba(255,107,0,0.25)]">
      <span className="text-[14px] mr-1.5">⚡</span>
      <span className="text-[13px] font-extrabold text-white">{credits}</span>
      <span className="text-[13px] font-semibold ml-1 text-white">créditos</span>
      <span className="mx-2 text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>|</span>
      <span className="text-[12px] font-bold" style={{ color: '#1A1A1A' }}>
        {usedToday}/{limitToday} hoje
      </span>
    </div>
  );
}
