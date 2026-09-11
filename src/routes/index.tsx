import React from 'react';
import { createFileRoute } from '@tanstack/react-router'
import { CreditsBadge } from '@/components/CreditsBadge';
import { FotoPost } from '@/components/antijegue/FotoPost';
import { PackDrawer } from '@/components/PackDrawer';

const BIBLIOTECA_REAL = [
  { id: 1, categoria: "CONFEITARIA", texto: "Bolo de cenoura fofinho com cobertura de chocolate... Parece que as árvores aqui levam a vida no modo 'devagar e sempre'! 🥕✨", emoji: "🍰", bg: "#FFD9C2" },
  { id: 2, categoria: "BARBEARIA / BELEZA", texto: "Seu cabelo tá sem vida? Kit Salon Line Meu Liso Demaquilante... Cansada de cabelos rebeldes? Chegou a solução!", emoji: "💇‍♀️", bg: "#1A1A1A" },
  { id: 3, categoria: "MOTIVACIONAL / VENDAS", texto: "Quer se destacar? A maioria das pessoas se perde nas distrações. Dan Koe ensina a focar no que importa.", emoji: "🚀", bg: "#EDE9FE" },
  { id: 4, categoria: "CONFEITARIA", texto: "Queijo derretendo, pão crocante. Hummm, dá água na boca! Sua fome não espera...", emoji: "🧀", bg: "#FFF1C1" },
  { id: 5, categoria: "GASTRONOMIA", texto: "Olha essa delícia! Que tal um tapioca recheada incrível? Sabor que vai te conquistar.", emoji: "🫓", bg: "#DCFCE7" },
  { id: 6, categoria: "CONFEITARIA PREMIUM", texto: "Essa torta te espera! Recheio cremoso. Massa dourada e crocante. Olha essa maravilha!", emoji: "🥧", bg: "#FFE4E6" },
];

function IndexPage() {
  const [deviceId, setDeviceId] = React.useState<string>("web");
  const [creditsReal, setCreditsReal] = React.useState(3);
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

  React.useEffect(() => {
    const handleCreditsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ credits?: number; delta?: number }>).detail;
      if (typeof detail?.credits === "number") {
        setCreditsReal(detail.credits);
      } else if (typeof detail?.delta === "number") {
        setCreditsReal(current => current + detail.delta!);
      }
    };

    window.addEventListener("credits-updated", handleCreditsUpdated);
    return () => window.removeEventListener("credits-updated", handleCreditsUpdated);
  }, []);

  const scrollToUpload = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1A1A1A] relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url('/printfotofundo.png')", backgroundRepeat: 'repeat', backgroundSize: '600px' }} />
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: "url('/gold_mudra_pattern.png')", backgroundRepeat: 'repeat', backgroundSize: '600px' }} />
      </div>

      <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#FFFBF5]/80 border-b border-black/[0.05]">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white font-black text-[18px] shadow-[0_6px_16px_rgba(255,107,0,0.35)]">A</div>
            <span className="font-extrabold text-[18px] tracking-tight lowercase"><span className="text-[#FF6B00]">anti</span><span className="text-[#1A1A1A]">-jegue</span></span>
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white border border-[#FF6B00]/40 text-[#FF6B00]">BETA</span>
          </div>
          <CreditsBadge deviceId={deviceId} credits={creditsReal} usedToday={0} limitToday={10} />
        </div>
      </header>

      <main className="relative z-10 max-w-[1120px] mx-auto px-5 sm:px-8">
        <div className="mx-auto max-w-[760px] pt-12 sm:pt-20 pb-10 text-center">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-[#0A66C2] border-[1.5px] border-white flex items-center justify-center text-[8px] font-black text-white">in</div>
              <div className="w-5 h-5 rounded-full bg-[#25D366] border-[1.5px] border-white flex items-center justify-center text-[10px]">💬</div>
              <div className="w-5 h-5 rounded-full border-[1.5px] border-white bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5] flex items-center justify-center text-[9px] text-white">◎</div>
            </div>
            <span className="text-[13px] font-semibold text-black/70">Escolha onde vai postar: LinkedIn, WhatsApp ou Instagram</span>
          </div>

          <h1 className="mt-6 text-[34px] sm:text-[52px] font-extrabold tracking-[-0.04em] leading-[0.95]">Manda uma foto, a gente cria sua propaganda</h1>
          <p className="mt-4 text-[16px] sm:text-[18px] leading-[1.5] text-black/60 font-medium max-w-[600px] mx-auto">Você não escreve nada. Só arrasta a foto do produto e recebe legenda + arte pronta pra postar e vender.</p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button onClick={scrollToUpload} className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] text-white px-10 py-[18px] text-[18px] sm:text-[20px] font-bold shadow-[0_12px_24px_rgba(255,107,0,0.3)] hover:brightness-105 active:scale-[0.98] transition">Mandar foto grátis →</button>
            <p className="text-[12px] sm:text-[13px] font-medium text-black/50"><span className="font-bold text-black/70">3 créditos grátis pra testar.</span> 1 crédito = 1 propaganda. Acabou? <span className="font-bold text-[#FF6B00]">1 PIX e continua vendendo.</span></p>
          </div>
        </div>

        <div id="upload-section" className="max-w-[720px] mx-auto pb-14 scroll-mt-[80px]">
          <FotoPost deviceId={deviceId} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-14">
          <div className="rounded-[24px] bg-white border border-black/[0.06] p-6 shadow-[0_4px_18px_rgba(0,0,0,0.03)]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-[11px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Leva 10 seg</span>
            <div className="mt-4 w-10 h-10 rounded-xl bg-[#FFF5EB] border border-[#FF6B00]/15 flex items-center justify-center text-[20px]">📸</div>
            <h3 className="mt-4 font-extrabold text-[18px]">Manda a foto do produto</h3>
            <p className="mt-1.5 text-[14px] leading-[1.5] text-black/60">Pode ser do celular mesmo. Da vitrine, do estoque, da bancada.</p>
          </div>
          <div className="rounded-[24px] bg-white border border-black/[0.06] p-6 shadow-[0_4px_18px_rgba(0,0,0,0.03)]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFEDD5] text-[#9A3412] text-[11px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" /> Instantâneo</span>
            <div className="mt-4 w-10 h-10 rounded-xl bg-[#FFF1C1] border border-[#FF6B00]/15 flex items-center justify-center text-[20px]">✍️</div>
            <h3 className="mt-4 font-extrabold text-[18px]">A gente escreve por você</h3>
            <p className="mt-1.5 text-[14px] leading-[1.5] text-black/60">Sem prompt, sem IA, sem enrolação. Legenda que vende + arte pronta.</p>
          </div>
          <div className="rounded-[24px] bg-white border border-black/[0.06] p-6 shadow-[0_4px_18px_rgba(0,0,0,0.03)]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#5B21B6] text-[11px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" /> Usa onde quiser</span>
            <div className="mt-4 w-10 h-10 rounded-xl bg-[#F5F0FF] border border-[#8B5CF6]/15 flex items-center justify-center text-[20px]">📲</div>
            <h3 className="mt-4 font-extrabold text-[18px]">Posta e vende</h3>
            <p className="mt-1.5 text-[14px] leading-[1.5] text-black/60">Copia e cola no Instagram, WhatsApp ou LinkedIn. Pronto para você vender ou mandar pros amigos!</p>
          </div>
        </div>

        <div className="pb-8">
          <div className="flex justify-between items-baseline mb-5">
            <h2 className="font-extrabold text-[22px] sm:text-[26px] tracking-tight">Biblioteca pronta de propagandas</h2>
            <span className="text-[13px] font-semibold text-black/50">feita com fotos reais de lojinha</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BIBLIOTECA_REAL.map(item => (
              <div key={item.id} className="rounded-[20px] bg-white border border-black/[0.06] p-4 flex gap-3.5 shadow-[0_4px_18px_rgba(0,0,0,0.03)]">
                <div className="w-[64px] h-[64px] rounded-[14px] flex items-center justify-center text-[26px] shrink-0 border border-black/[0.04]" style={{ background: item.bg }}>{item.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF5EB] border border-[#FF6B00]/15 text-[#FF6B00] text-[10px] font-extrabold uppercase">{item.categoria}</span>
                    <span className="text-[10px] text-black/40">gerado hoje</span>
                  </div>
                  <p className="mt-2 text-[14px] leading-[1.4] text-black/70 font-medium line-clamp-2">{item.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gaveta Packs - descoberta */}
        <div className="pb-16">
          <PackDrawer onOpenPack={()=> window.location.href='/pack'} />
        </div>
      </main>

      <footer className="relative z-10 border-t border-black/[0.06] bg-white/80 backdrop-blur">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]">
            <div className="flex items-center gap-2.5 font-medium">
              <span className="w-7 h-7 rounded-full bg-[#FF6B00] text-white font-black flex items-center justify-center text-[13px]">A</span>
              <span className="text-black/70">Anti-Jegue • feito pra quem vende, não pra quem programa.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF1E6] border border-[#FF6B00]/20 text-[#9A4A1A] font-bold text-[12px]">🔒 sem mensalidade • só PIX quando acabar</span>
              <span className="text-black/50 font-medium">1 crédito = 1 propaganda</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})
