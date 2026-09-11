import { useEffect, useState } from "react";

type Props = {
  credits?: number;
  usedToday?: number;
  limitToday?: number;
  deviceId?: string;
};

function getInitialCredits(fallback: number): number {
  try {
    const saved = localStorage.getItem("credits");
    if (saved) {
      const n = parseInt(saved);
      if (!isNaN(n)) return n;
    }
  } catch {}
  return fallback;
}

export function CreditsBadge({ credits: initialCredits = 3, usedToday = 0, limitToday = 10, deviceId }: Props) {
  const [credits, setCredits] = useState(() => {
    // Leitura síncrona pra não piscar 3 -> 2
    if (typeof window !== "undefined") {
      return getInitialCredits(initialCredits);
    }
    return initialCredits;
  });

  useEffect(() => {
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
        }
      } else {
        setCredits((prev) => {
          const next = Math.max(0, prev - 1);
          try { localStorage.setItem("credits", String(next)); } catch {}
          return next;
        });
      }
    };

    window.addEventListener("credits-updated" as any, handler);
    // Também escuta storage de outra aba
    const onStorage = () => {
      try {
        const saved = localStorage.getItem("credits");
        if (saved) setCredits(parseInt(saved));
      } catch {}
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("credits-updated" as any, handler);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Se o prop inicial for menor que o atual (ex: veio 0 do servidor), usa o menor
  useEffect(() => {
    setCredits((prev) => {
      if (initialCredits < prev) {
        try { localStorage.setItem("credits", String(initialCredits)); } catch {}
        return initialCredits;
      }
      return prev;
    });
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
