import { useEffect, useState } from "react";

type Props = {
  credits?: number;
  usedToday?: number;
  limitToday?: number;
  deviceId?: string;
};

// Busca crédito real do Supabase - corrige P0 sem precisar mudar texto fixo do index/pack
export function CreditsBadge({ credits: initialCredits = 3, usedToday = 0, limitToday = 10, deviceId }: Props) {
  const [credits, setCredits] = useState(initialCredits);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const id = deviceId || localStorage.getItem("device_id") || "74d43458-78ad-4361-8066-dbb182208330";
      // Tenta via Supabase client se existir, fallback para API
      const { createClient } = await import("@/integrations/supabase/client").catch(() => ({ createClient: null })) as any;
      if (createClient) {
        const supabase = createClient();
        const { data } = await supabase.from("users").select("credits, creditos").eq("device_id", id).single();
        if (data) {
          // sua tabela tem credits e creditos - usa o que tiver valor
          const val = (data.credits ?? data.creditos ?? initialCredits) as number;
          setCredits(val);
        }
      } else {
        // fallback: tenta via server function
        const { supabase } = await import("@/lib/supabase").catch(() => ({ supabase: null })) as any;
        if (supabase) {
          const { data } = await supabase.from("users").select("credits, creditos").eq("device_id", id).single();
          if (data) setCredits((data.credits ?? data.creditos ?? initialCredits) as number);
        }
      }
    } catch {
      // mantém initial
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    const onUpdate = () => fetchCredits();
    window.addEventListener("credits-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("credits-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [deviceId]);

  return (
    <div className="inline-flex items-center rounded-full bg-[#FF6B00]/90 backdrop-blur border border-[#FF6B00]/20 px-[16px] py-[8px] shadow-[0_2px_12px_rgba(255,107,0,0.25)]">
      <span className="text-[14px] mr-1.5">⚡</span>
      <span className="text-[13px] font-extrabold text-white">{isLoading ? "..." : credits}</span>
      <span className="text-[13px] font-semibold ml-1 text-white">créditos</span>
      <span className="mx-2 text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>|</span>
      <span className="text-[12px] font-bold" style={{ color: '#1A1A1A' }}>
        {usedToday}/{limitToday} hoje
      </span>
    </div>
  );
}
