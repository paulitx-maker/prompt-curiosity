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
    // tenta restaurar do localStorage (onde FotoPost salva)
    try {
      const saved = localStorage.getItem("credits");
      if (saved) {
        const n = parseInt(saved);
        if (!isNaN(n)) setCredits(n);
      }
    } catch {}

    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) {
        if (typeof ce.detail.credits === "number") {
          setCredits(ce.detail.credits);
          try { localStorage.setItem("credits", String(ce.detail.credits)); } catch {}
        } else if (typeof ce.detail.delta === "number") {
          setCredits((prev) => {
            const next = Math.max(0, prev + ce.detail.delta);
            try { localStorage.setItem("credits", String(next)); } catch {}
            return next;
          });
        } else {
          // sem detail, apenas decrementa 1 (fallback)
          setCredits((prev) => {
            const next = Math.max(0, prev - 1);
            try { localStorage.setItem("credits", String(next)); } catch {}
            return next;
          });
        }
      } else {
        setCredits((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("credits-updated" as any, handler);
    return () => window.removeEventListener("credits-updated" as any, handler);
  }, []);

  // se prop mudar (ex: veio do servidor), sincroniza se for menor
  useEffect(() => {
    setCredits((prev) => Math.min(prev, initialCredits));
  }, [initialCredits]);

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
