import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon, Lock, Mic } from "lucide-react";
import { FotoPost } from "@/components/antijegue/FotoPost";
import { AudioResumo } from "@/components/antijegue/AudioResumo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [tab, setTab] = useState<"foto" | "audio">("foto");
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
      <section className="mt-12 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Próximas aulas</h2>
        <div className="flex items-center gap-3 rounded-2xl border bg-surface/60 p-4 opacity-60"><Lock className="h-4 w-4" /> Aula 3 — Texto → Imagem</div>
        <div className="flex items-center gap-3 rounded-2xl border bg-surface/60 p-4 opacity-60"><Lock className="h-4 w-4" /> Aula 4 — Ideia → Vídeo curto</div>
      </section>
    </main>
  );
}