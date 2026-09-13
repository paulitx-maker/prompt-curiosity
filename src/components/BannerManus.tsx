import { useEffect, useState } from "react";

type Banner = { id: string; titulo: string; imagem_url: string; link_url: string; posicao: string; ordem: number; };

type Props = { posicao: "home_after_biblioteca" | "pack_top" | "home_after_packdrawer"; modo?: "vivo_random" | "parceiros" | "manus_estatico"; };

export function BannerManus({ posicao, modo = "parceiros" }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [vivo, setVivo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const url = (import.meta as any).env?.VITE_SUPABASE_URL;
        const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_KEY;
        if (!url || !anon) return;

        if (modo === "vivo_random") {
          // Caso 1 separado: 1 post random executions nota>=4 + 1 prompt vw_pack_venda random, com fade
          const r1 = await fetch(`${url}/rest/v1/executions?pode_usar_publico=eq.true&nota=gte.4&order=created_at.desc&limit=5&select=*`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
          const r2 = await fetch(`${url}/rest/v1/vw_pack_venda?ativo=eq.true&order=created_at.desc&limit=5&select=*`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
          const d1 = r1.ok ? await r1.json() : [];
          const d2 = r2.ok ? await r2.json() : [];
          const all = [...d1.map((x:any)=>({tipo:'post', ...x})), ...d2.map((x:any)=>({tipo:'prompt', ...x}))];
          if (all.length>0) setVivo(all[Math.floor(Math.random()*all.length)]);
          return;
        }

        // Caso 3: banners_parceiros tabela Supabase
        const res = await fetch(`${url}/rest/v1/banners_parceiros?parceiro=eq.manus&ativo=eq.true&posicao=eq.${posicao}&order=ordem.asc&select=*`, {
          headers: { apikey: anon, Authorization: `Bearer ${anon}` }
        });
        if (res.ok) setBanners(await res.json());
      } catch {}
    })();
  }, [posicao, modo]);

  if (modo === "vivo_random" && vivo) {
    return (
      <div className="rounded-[20px] bg-white border border-[#FF6B00]/20 p-4 shadow flex gap-3 relative overflow-hidden">
        <div className="w-[80px] h-[80px] rounded-[14px] bg-[#FFF5EB] flex items-center justify-center text-[28px]">📸</div>
        <div className="flex-1 relative">
          <span className="px-2 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-bold uppercase">{vivo.tipo} • VIVO RANDOM • {vivo.categoria || 'GERAL'}</span>
          <p className="mt-2 text-[14px] font-bold line-clamp-2">{vivo.titulo || vivo.legenda || vivo.prompt_preview_40 || 'Conteúdo vivo random'}</p>
          <p className="mt-1 text-[12px] text-black/60 line-clamp-2 relative">{(vivo.legenda || vivo.prompt_preview_40 || '').slice(0,100)}<div className="absolute bottom-0 left-0 right-0 h-[20px] bg-gradient-to-b from-transparent to-white" /></p>
        </div>
      </div>
    );
  }

  if (modo === "manus_estatico") {
    // Caso 2: public/banners desktop e mobile - layout específico, link ativo 500 créditos indicação
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <a href="https://manus.im/invitation/VS8DGZ3QZ8FSYF" target="_blank" rel="noopener noreferrer" className="block rounded-[16px] bg-[#1A1A1A] text-white p-4 hover:bg-black border border-[#FF6B00]/20">
          <p className="text-[11px] font-bold">DESKTOP public/banners/manus-desktop.png</p>
          <div className="mt-2 h-[60px] bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] rounded-[12px] flex items-center justify-center text-[12px] font-bold">Banner Manus Desktop - 1200x300 - link ativo 500 créditos</div>
        </a>
        <a href="https://manus.im/invitation/VS8DGZ3QZ8FSYF" target="_blank" rel="noopener noreferrer" className="block rounded-[16px] bg-[#1A1A1A] text-white p-4 hover:bg-black border border-[#FF6B00]/20">
          <p className="text-[11px] font-bold">MOBILE public/banners/manus-mobile.png</p>
          <div className="mt-2 h-[60px] bg-gradient-to-r from-[#8B5CF6] to-[#FF6B00] rounded-[12px] flex items-center justify-center text-[12px] font-bold">Banner Manus Mobile - 400x200 - link ativo</div>
        </a>
      </div>
    );
  }

  if (banners.length === 0) return null;
  return (
    <div className="w-full space-y-3">
      {banners.map(b => (
        <a key={b.id} href={b.link_url || "https://manus.im/invitation/VS8DGZ3QZ8FSYF"} target="_blank" rel="noopener noreferrer" className="block rounded-[20px] overflow-hidden border border-black/[0.06] shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition">
          <img src={b.imagem_url} alt={b.titulo} className="w-full h-auto object-cover" loading="lazy" />
        </a>
      ))}
    </div>
  );
}

