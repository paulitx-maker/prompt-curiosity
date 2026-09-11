import { useState, useRef } from "react";
import { Lock, Sparkles, ChevronRight, BookOpen, Gift } from "lucide-react";

type PackDrawerProps = {
  onOpenPack?: () => void;
};

// Gaveta meio aberta - descoberta, não marketplace direto
// Mostra metade do conteúdo após geração, precisa segurar/arrastar pra abrir
export function PackDrawer({ onOpenPack }: PackDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragProgress, setDragProgress] = useState(0.35); // começa 35% aberta - metade visível

  return (
    <div id="biblioteca" className="mt-16 relative overflow-hidden rounded-[24px] border border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
      {/* Header gaveta - sempre visível */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBF5] border border-[#FF6B00]/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[18px] tracking-tight">Packs & Módulos</h3>
              <p className="text-[12px] text-black/50 font-medium">Em breve</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-black/40">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            Novo
          </div>
        </div>
        
        {/* Preview meio aberto - 35% visível */}
        <div className="mt-5 relative">
          <div className="grid grid-cols-3 gap-3 opacity-60" style={{ height: `${120 + dragProgress * 200}px`, overflow: 'hidden', transition: 'height 0.3s' }}>
            {/* Pack cards desfocados atrás da gaveta */}
            <div className="rounded-[14px] bg-[#FFF5EB] border border-[#FF6B00]/10 p-3 h-[100px]">
              <div className="w-6 h-6 rounded-lg bg-[#FF6B00]/20 mb-2" />
              <div className="h-2 bg-black/10 rounded w-3/4 mb-1" />
              <div className="h-2 bg-black/5 rounded w-1/2" />
            </div>
            <div className="rounded-[14px] bg-[#EDE9FE] border border-[#8B5CF6]/10 p-3 h-[100px]">
              <div className="w-6 h-6 rounded-lg bg-[#8B5CF6]/20 mb-2" />
              <div className="h-2 bg-black/10 rounded w-3/4 mb-1" />
              <div className="h-2 bg-black/5 rounded w-1/2" />
            </div>
            <div className="rounded-[14px] bg-[#DCFCE7] border border-[#22C55E]/10 p-3 h-[100px]">
              <div className="w-6 h-6 rounded-lg bg-[#22C55E]/20 mb-2" />
              <div className="h-2 bg-black/10 rounded w-3/4 mb-1" />
              <div className="h-2 bg-black/5 rounded w-1/2" />
            </div>
            {isOpen && (
              <>
                <div className="rounded-[14px] bg-white border border-black/5 p-3">
                  <p className="text-[11px] font-bold">Confeitaria Lucrativa</p>
                  <p className="text-[10px] text-black/50 mt-1">5 prompts + 1 módulo grátis</p>
                </div>
                <div className="rounded-[14px] bg-white border border-black/5 p-3">
                  <p className="text-[11px] font-bold">Barbearia Premium</p>
                  <p className="text-[10px] text-black/50 mt-1">7 prompts + checklist</p>
                </div>
                <div className="rounded-[14px] bg-white border border-black/5 p-3">
                  <p className="text-[11px] font-bold">Moda que Vende</p>
                  <p className="text-[10px] text-black/50 mt-1">Curso 4 módulos</p>
                </div>
              </>
            )}
          </div>
          
          {/* Gradiente que esconde o resto - efeito gaveta */}
          {!isOpen && (
            <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Barra de segurar pra abrir - interação de descoberta */}
      <div className="px-6 pb-5">
        {!isOpen ? (
          <button 
            onMouseDown={()=> setIsOpen(true)}
            onTouchStart={()=> setIsOpen(true)}
            onClick={()=> setIsOpen(true)}
            className="w-full group relative rounded-full bg-[#1A1A1A] text-white px-5 py-3.5 font-bold text-[14px] flex items-center justify-between overflow-hidden hover:bg-black transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <span>Segura pra descobrir - 1º módulo grátis</span>
            </div>
            <div className="flex items-center gap-1 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition">
              <span className="text-[12px]">Abrir</span>
              <ChevronRight className="w-4 h-4" />
            </div>
            {/* Barra de progresso 35% */}
            <div className="absolute bottom-0 left-0 h-[3px] bg-[#FF6B00]" style={{ width: '35%' }} />
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Upsell que você descreveu: resgate módulo 1 grátis, PIX 4.99 ganha +4/5 módulos */}
            <div className="rounded-[16px] bg-[#FFFBF5] border border-[#FF6B00]/20 p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-black">1</div>
              <div className="flex-1">
                <p className="text-[13px] font-extrabold">Resgate o 1º módulo grátis</p>
                <p className="text-[12px] text-black/60 mt-0.5 leading-[1.4]">Calma... você vai adorar!</p>
                <button onClick={onOpenPack} className="mt-2 text-[12px] font-bold text-[#FF6B00] hover:underline">Abrir no /pack →</button>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#22C55E] text-white h-fit">GRÁTIS</span>
            </div>

            <div className="rounded-[16px] bg-[#1A1A1A] text-white p-4 flex gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF6B00]/20 blur-[20px] rounded-full" />
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1 relative z-10">
                <p className="text-[13px] font-extrabold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" /> Desbloqueia +4 módulos por R$ 4,99</p>
                <p className="text-[12px] text-white/60 mt-0.5 leading-[1.4]">Melhore sua gestão com cursos práticos e eficazes.</p>
                <div className="mt-3 flex gap-2">
                  <button className="px-4 py-2 rounded-full bg-[#FF6B00] text-white text-[12px] font-bold hover:brightness-110">PIX R$ 4,99 → libera 5 módulos</button>
                  <span className="text-[11px] text-white/40 self-center">ou continua só com grátis</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button onClick={()=> setIsOpen(false)} className="text-[12px] font-bold text-black/40 hover:text-black">Fechar gaveta</button>
              <button onClick={onOpenPack} className="text-[12px] font-bold text-[#FF6B00]">Ir pra /pack completo →</button>
            </div>
          </div>
        )}
      </div>

      {/* Nota de negócio - só visível quando aberta */}
      {isOpen && (
        <div className="mx-6 mb-5 p-3 rounded-[12px] bg-black/[0.02] border border-black/[0.03] text-[11px] text-black/50 leading-[1.4]">
                    <strong>Estamos montando tudo para você:</strong> Em breve, todos os módulos estarão disponíveis para compra individual ou em pacotes. Fique atento às novidades e aproveite o 1º módulo grátis!

        </div>
      )}
    </div>
  );
}
