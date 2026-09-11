import { useEffect, useState } from "react";

type Props = {
  credits?: number;
  usedToday?: number;
  limitToday?: number;
  deviceId?: string;
};

export function CreditsBadge({ credits: initialCredits = 3, usedToday = 0, limitToday = 10, deviceId }: Props) {
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    const id = deviceId || (() => {
      try { return localStorage.getItem("device_id") || ""; } catch { return ""; }
    })();
    if (!id) return;

    const fetchCredits = async () => {
      try {
        // Usa o mesmo client que seu device.ts já usa, mas via fetch REST pra não quebrar build
        const url = (import.meta as any).env?.VITE_SUPABASE_URL;
        const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_KEY;
        if (url && anon) {
          const res = await fetch(`${url}/rest/v1/users?device_id=eq.${id}&select=credits,creditos`, {
            headers: { apikey: anon, Authorization: `Bearer ${anon}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data[0]) {
              const real = (data[0].credits ?? data[0].creditos ?? initialCredits) as number;
              setCredits(real);
              return;
            }
          }
        }
        // fallback: tenta via supabase client se existir (dynamic, não quebra build)
        try {
          const mod = await import("@/lib/supabase");
          const sb = (mod as any).supabase;
          if (sb) {
            const { data } = await sb.from("users").select("credits,creditos").eq("device_id", id).single();
            if (data) setCredits((data.credits ?? data.creditos ?? initialCredits) as number);
          }
        } catch {}
      } catch {}
    };

    fetchCredits();

    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail && typeof ce.detail.credits === "number") {
        setCredits(ce.detail.credits);
      } else if (ce.detail && typeof ce.detail.delta === "number") {
        setCredits((prev) => Math.max(0, prev + ce.detail.delta));
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
