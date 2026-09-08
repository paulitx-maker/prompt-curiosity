import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image as ImageIcon, Mic, Sparkles, RefreshCw, Zap } from "lucide-react";
import { FotoPost } from "@/components/antijegue/FotoPost";
import { AudioResumo } from "@/components/antijegue/AudioResumo";
import { CreditsBadge } from "@/components/CreditsBadge";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getDeviceId } from '@/lib/device'
import { useTracking } from "@/hooks/use-tracking";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [tab, setTab] = useState<"foto" | "audio">("foto");
  const [lastPost, setLastPost] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [usadoHoje, setUsadoHoje] = useState<number>(0);
  const [consuming, setConsuming] = useState(false);
  const { track } = useTracking();

  const loadCredits = async (dId: string) => {
    try {
      const res = await fetch('/api/ensure-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: dId })
      });
      const data = await res.json();
      if (data?.credits!== undefined) setCredits(data.credits);
      if (data?.usadoHoje!== undefined) setUsadoHoje(data.usadoHoje);
    } catch {}
  };

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    if(id) loadCredits(id);
    const h1 = (e: any) => setLastPost(e.detail);
    const h2 = () => { if(id) loadCredits(id); };
    window.addEventListener("post-gerado", h1);
    window.addEventListener("credits-updated", h2);
    return () => {
      window.removeEventListener("post-gerado", h1);
      window.removeEventListener("credits-updated", h2);
    };
  }, []);

  async function handleVariacao() {
    if(!deviceId || consuming) return;
    if(usadoHoje >= 10){ toast.error("Limite de 10 hoje atingido."); return; }
    setConsuming(true);
    try {
      window.dispatchEvent(new Event("gerar-variacao"));
      if(deviceId) await loadCredits(deviceId);
      window.dispatchEvent(new Event("credits-updated"));
      toast.success("Variação -1 crédito");
    } finally { setConsuming(false); }
  }

  if(!deviceId) return null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-[88px] pt-10">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Aula 1</p>
        <CreditsBadge credits={credits} usadoHoje={usadoHoje} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Anti-<span className="text-gradient-neon">Jegue</span></h1>
        <p className="text-sm text-muted-foreground">Aqui você não escreve prompt. Responde 3 perguntas, a IA executa no modelo mais barato e você vê quanto custou.</p>
        {credits <= 0 && (
          <button onClick={() => window.dispatchEvent(new Event("abrir-paywall"))} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white animate-pulse">
            <Zap className="h-3 w-3" /> Comprar R$4,90
          </button>
        )}
      </header>
      <nav className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-1.5">
        <button onClick={() => setTab("foto")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab==="foto"? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground")}><ImageIcon className="h-4 w-4" />Foto → Post</button>
        <button onClick={() => setTab("audio")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab==="audio"? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground")}><Mic className="h-4 w-4" />Áudio → Resumo</button>
      </nav>
      <section className="mt-7">
        {tab === "foto" && <FotoPost deviceId={deviceId!} />}
        {tab === "audio" && <AudioResumo deviceId={deviceId!} />}
      </section>      {lastPost && (
        <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Gerado</div>
          <p className="text-sm whitespace-pre-wrap">{lastPost}</p>
          <div className="flex gap-2 pt-2">
            <button disabled={consuming} onClick={handleVariacao} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-medium disabled:opacity-50"><RefreshCw className={cn("h-4 w-4", consuming && "animate-spin")} />{consuming? "..." : "Variação (1 crédito)"}</button>
            <Link to="/pack" className="flex flex-1 items-center justify-center rounded-xl border bg-white py-3 text-sm">Ver Biblioteca →</Link>
          </div>
        </section>
      )}
      <BottomNav />
    </main>
  );
}