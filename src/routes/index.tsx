import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image as ImageIcon, Lock, Mic, Sparkles, RefreshCw } from "lucide-react";
import { FotoPost } from "@/components/antijegue/FotoPost";
import { AudioResumo } from "@/components/antijegue/AudioResumo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [tab, setTab] = useState<"foto" | "audio">("foto");
  const [lastPost, setLastPost] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    setDeviceId(localStorage.getItem("device_id") || "");
    // escuta evento do FotoPost quando gerar
    const handler = (e: any) => setLastPost(e.detail);
    window.addEventListener("post-gerado", handler);
    return () => window.removeEventListener("post-gerado", handler);
  }, []);

  async function gastarCredito() {
    const hoje = new Date().toISOString().slice(0,10);
    const { count } = await supabase.from("executions").select("*", { count: "exact", head: true }).eq("device_id", deviceId).gte("created_at", `${hoje}T00:00:00`);
    if ((count || 0) >= 10) {
      toast.error("Limite de 10 hoje atingido. Volta amanhã, monstro tá cansado.");
      throw new Error("LIMITE");
    }
    const { data: user } = await supabase.from("users").select("credits").eq("device_id", deviceId).single();
    if (!user || user.credits <= 0) {
      window.dispatchEvent(new Event("abrir-paywall"));
      throw new Error("SEM_CREDITO");
    }
    await supabase.rpc("increment_credits", { d_id: deviceId, qtd: -1 } as any);
    await supabase.from("executions").insert({ device_id: deviceId, tipo: "geracao_post" } as any);
    window.dispatchEvent(new Event("credits-updated"));
  }

  async function handleVariacao() {
    try {
      await gastarCredito();
      // re-dispara a geração no FotoPost
      window.dispatchEvent(new Event("gerar-variacao"));
      toast.success("Gerando variação -1 crédito");
    } catch {}
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Aula 1</p>
        <h1 className="text-3xl font-bold tracking-tight">Anti-<span className="text-gradient-neon">Jegue</span></h1>
        <p className="text-sm text-muted-foreground">Aqui você não escreve prompt. Responde 3 perguntas, a IA executa no modelo mais barato e você vê quanto custou.</p>
      </header>

      <nav className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-1.5">
        <button onClick={() => setTab("foto")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab==="foto" ? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground hover:text-foreground")}><ImageIcon className="h-4 w-4" />Foto → Post</button>
        <button onClick={() => setTab("audio")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab==="audio" ? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground hover:text-foreground")}><Mic className="h-4 w-4" />Áudio → Resumo</button>
      </nav>

      <section className="mt-7">{tab === "foto" ? <FotoPost /> : <AudioResumo />}</section>

      {lastPost && (
        <section className="mt-6 animate-in fade-in rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Gerado</div>
          <p className="text-sm whitespace-pre-wrap">{lastPost}</p>
          <div className="flex gap-2 pt-2">
            <button onClick={handleVariacao} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-medium"><RefreshCw className="h-4 w-4" />Gerar variação (1 crédito)</button>
            <Link to="/pack" params={{ id: "1" }} search={{ from: "gerador" }} className="flex flex-1 items-center justify-center rounded-xl border bg-white py-3 text-sm">Ver pack secreto →</Link>
          </div>
        </section>
      )}

      <section className="mt-12 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Próximas aulas</h2>
        <div className="flex items-center gap-3 rounded-2xl border bg-surface/60 p-4 opacity-60"><Lock className="h-4 w-4" /> Aula 3 — Texto → Imagem</div>
        <div className="flex items-center gap-3 rounded-2xl border bg-surface/60 p-4 opacity-60"><Lock className="h-4 w-4" /> Aula 4 — Ideia → Vídeo curto</div>
      </section>
    </main>
  );
}