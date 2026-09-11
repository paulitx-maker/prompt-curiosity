import { useEffect, useState } from "react";

type Props = {
  credits?: number;
  usedToday?: number;
  limitToday?: number;
  deviceId?: string;
};

export function CreditsBadge({ credits: initialCredits = 3, usedToday = 0, limitToday = 10 }: Props) {
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    const handleCreditsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ credits?: number; delta?: number }>).detail;
      if (typeof detail?.credits === "number") {
        setCredits(detail.credits);
      } else if (typeof detail?.delta === "number") {
        setCredits(current => current + detail.delta!);
      }
    };

    window.addEventListener("credits-updated", handleCreditsUpdated);
    return () => window.removeEventListener("credits-updated", handleCreditsUpdated);
  }, []);

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
