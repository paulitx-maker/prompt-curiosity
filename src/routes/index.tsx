import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon, Lock, Mic } from "lucide-react";
import { FotoPost } from "@/components/antijegue/FotoPost";
import { AudioResumo } from "@/components/antijegue/AudioResumo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Anti-Jegue — Escola de Prompt com IA" },
      {
        name: "description",
        content:
          "Aula 1 da escola de prompts: responda 3 perguntas guiadas e a IA gera seu post ou resumo com o modelo mais barato, mostrando o custo.",
      },
      { property: "og:title", content: "Anti-Jegue — Escola de Prompt com IA" },
      {
        property: "og:description",
        content:
          "Sem prompt livre. Pre-flight de 3 perguntas, execução com modelo barato e custo em tokens na tela.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<"foto" | "audio">("foto");

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Aula 1</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Anti-<span className="text-gradient-neon">Jegue</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Aqui você não escreve prompt. Responde 3 perguntas, a IA executa no modelo mais barato e
          você vê quanto custou.
        </p>
      </header>

      <nav className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-1.5">
        <TabButton
          active={tab === "foto"}
          onClick={() => setTab("foto")}
          icon={<ImageIcon className="h-4 w-4" />}
          label="Foto → Post"
        />
        <TabButton
          active={tab === "audio"}
          onClick={() => setTab("audio")}
          icon={<Mic className="h-4 w-4" />}
          label="Áudio → Resumo"
        />
      </nav>

      <section className="mt-7">{tab === "foto" ? <FotoPost /> : <AudioResumo />}</section>

      <section className="mt-12 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Próximas aulas</h2>
        <LockedLesson
          title="Aula 3 — Texto → Imagem"
          description="Comparativo de custo: SDXL vs Flux."
        />
        <LockedLesson title="Aula 4 — Ideia → Vídeo curto" description="Roteiro, corte e custo." />
      </section>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all",
        active
          ? "bg-gradient-neon text-primary-foreground glow-soft"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function LockedLesson({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/60 p-4 opacity-60">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Lock className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
