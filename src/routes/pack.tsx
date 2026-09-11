import React from 'react';
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { CreditsBadge } from '@/components/CreditsBadge';

const PROMPTS = [
  { cat: "Design", title: "Prompt para Criar Logo no Midjourney", desc: "Crie um prompt perfeito para Midjourney gerar logo minimalista para [MARCA] no estilo [ESTILO] --ar 1:1...", price: "R$ 14.90" },
  { cat: "Vendas", title: "Roteiro para Vídeo de Vendas VSL", desc: "Escreva roteiro VSL de 5 minutos para [PRODUTO], estrutura: dor, mecanismo, prova, oferta...", price: "R$ 29.90" },
  { cat: "RH", title: "Resposta para Pergunta de Entrevista", desc: "Responda 'fale sobre você' para vaga de [CARGO] com storytelling curto que impressiona...", price: "R$ 14.90" },
  { cat: "Jurídico", title: "Checklist de Auditoria Trabalhista", desc: "Gere checklist de auditoria trabalhista preventiva para empresa com [N] funcionários...", price: "R$ 24.90" },
  { cat: "Marketing", title: "Sequência de Stories - Lançamento", desc: "Crie sequência de 8 stories para aquecimento de lançamento de [PRODUTO] amanhã...", price: "R$ 19.90" },
  { cat: "Finanças", title: "Cálculo de Preço e Lucro", desc: "Calcule preço de venda ideal para produto que custa R$ [CUSTO] e quero lucro de [X]%, com taxas de [TAXA]...", price: "R$ 14.90" },
];

function PackPage() {
  const [filter, setFilter] = useState("Todas");
  const [deviceId, setDeviceId] = React.useState<string>("web");
  React.useEffect(() => {
    try {
      let id = localStorage.getItem("device_id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("device_id", id);
      }
      setDeviceId(id);
    } catch {
      setDeviceId("web");
    }
  }, []);
  const cats = ["Todas", "Design", "Vendas", "RH", "Jurídico", "Marketing", "Finanças", "Atendimento", "Produtividade"];
  
  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1A1A1A]">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 py-12">
        <div className="text-center max-w-[640px] mx-auto">
          <h1 className="text-[32px] font-extrabold tracking-tight">Brazilian Prompt Pack</h1>
          <div className="mt-3 flex items-center justify-center gap-3">
            <CreditsBadge deviceId={deviceId} credits={3} usedToday={0} limitToday={10} />
            <span className="text-[13px] text-black/50">• A partir de R$4,90 • Curadoria via Supabase</span>
          </div>
          <div className="mt-4">
            <a href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-black/10 text-[12px] font-bold hover:bg-black/[0.02]">← Voltar pra gerar post</a>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {cats.map(c => (
              <button key={c} onClick={()=> setFilter(c)} className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition ${filter===c ? "bg-[#1A1A1A] text-white border-black" : "bg-white border-black/10 text-black/60 hover:border-[#FF6B00]/30"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-6">
            <input placeholder="Buscar..." className="w-full h-11 rounded-full border border-black/10 bg-white px-4 text-[14px] outline-none focus:border-[#FF6B00]/30 focus:ring-2 focus:ring-[#FF6B00]/10" />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROMPTS.filter(p=> filter==="Todas" || p.cat===filter).map((p,i)=> (
            <div key={i} className="rounded-[20px] bg-white border border-black/[0.06] p-5 shadow-[0_4px_18px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#FF6B00]/20 transition group">
              <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FFF5EB] border border-[#FF6B00]/15 text-[#FF6B00] text-[10px] font-extrabold uppercase">{p.cat}</span>
              <h3 className="mt-3 font-extrabold text-[15px] leading-[1.3] group-hover:text-[#FF6B00] transition">{p.title}</h3>
              <p className="mt-2 text-[12px] leading-[1.4] text-black/60 line-clamp-3">{p.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[13px] font-extrabold">{p.price}</span>
                <button className="px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition">Copiar Prompt</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[24px] bg-[#1A1A1A] text-white p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <p className="font-extrabold text-[16px]">Quer 1 curso para melhorar a sua gestão por R$ 4,99? Já já vem novidade...</p>
            <p className="text-[12px] text-white/60 mt-1">Em desenvolvimento</p>
          </div>
          <button className="px-6 py-3 rounded-full bg-[#FF6B00] text-white font-bold text-[13px] whitespace-nowrap">Desbloquear por PIX</button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/pack')({
  component: PackPage,
})
