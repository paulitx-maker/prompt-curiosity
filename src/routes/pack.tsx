import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Loader2, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Produto {
  id: string;
  titulo: string | null;
  prompt: string | null;
  categoria: string | null;
  preco: number | string | null;
}

async function fetchPack(): Promise<Produto[]> {
  // Fonte primária: view vw_pack_venda; fallback: tabela produtos.
  // Tabelas fora do schema tipado gerado — cast proposital.
  const db = supabase as unknown as {
    from: (t: string) => any;
  };
  const { data: pack, error } = await db
    .from("vw_pack_venda")
    .select("*")
    .eq("ativo", true)
    .order("categoria");
  if (!error && pack && pack.length > 0) {
    console.log("[/pack] fonte: vw_pack_venda");
    return pack as Produto[];
  }
  console.log("[/pack] fonte: produtos (fallback)");
  const { data: produtos, error: err2 } = await db
    .from("produtos")
    .select("id,titulo,prompt,categoria,preco")
    .eq("ativo", true)
    .order("categoria");
  if (err2) throw err2;
  return (produtos ?? []) as Produto[];
}

const packQueryOptions = queryOptions({
  queryKey: ["pack-venda"],
  queryFn: fetchPack,
  staleTime: 60_000,
});

export const Route = createFileRoute("/pack")({
  head: () => ({
    meta: [
      { title: "Brazilian Prompt Pack — Mais de 50 Prompts que Vendem" },
      {
        name: "description",
        content:
          "Copie e cole no ChatGPT, Claude, Gemini. Prompts prontos por categoria, testados em clientes reais.",
      },
      { property: "og:title", content: "Brazilian Prompt Pack — Mais de 50 Prompts que Vendem" },
      {
        property: "og:description",
        content:
          "Copie e cole no ChatGPT, Claude, Gemini. Testado em clientes reais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(packQueryOptions),
  component: PackPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-md px-5 py-20 text-center text-sm text-destructive">
      Não foi possível carregar os prompts: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Página não encontrada.</div>,
});

const CATEGORIAS = ["Todas", "Marketing", "Vendas", "Juridico", "RH", "Produtividade"] as const;

const badgeColors: Record<string, string> = {
  Marketing: "border-purple-400/40 bg-purple-500/15 text-purple-300",
  Vendas: "border-green-400/40 bg-green-500/15 text-green-300",
  Juridico: "border-blue-400/40 bg-blue-500/15 text-blue-300",
  RH: "border-orange-400/40 bg-orange-500/15 text-orange-300",
  Produtividade: "border-gray-400/40 bg-gray-500/15 text-gray-300",
};
const badgeDefault = "border-border bg-secondary text-muted-foreground";

function PackPage() {
  const { data: produtos } = useSuspenseQuery(packQueryOptions);
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("Todas");
  const [busca, setBusca] = useState("");
  const [avaliando, setAvaliando] = useState<Produto | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (categoria !== "Todas" && p.categoria !== categoria) return false;
      if (termo && !(p.titulo ?? "").toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [produtos, categoria, busca]);

  const copiar = async (p: Produto) => {
    try {
      await navigator.clipboard.writeText(p.prompt ?? "");
      toast.success("Prompt copiado!");
    } catch (e) {
      console.error("clipboard falhou", e);
      toast.error("Não consegui copiar. Selecione o texto manualmente.");
    }
    // Nunca bloquear a UI por causa do insert de intenção.
    try {
      const db = supabase as unknown as { from: (t: string) => any };
      await db
        .from("intencoes_compra")
        .insert({ produto_id: p.id, etapa: "click_copiar" });
    } catch (e) {
      console.error("intencoes_compra insert falhou", e);
    }
    setTimeout(() => setAvaliando(p), 500);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 pb-16 pt-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Brazilian Prompt Pack -{" "}
          <span className="text-gradient-neon">Mais de 50 Prompts que Vendem</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Copie e cole no ChatGPT, Claude, Gemini. Testado em clientes reais.
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {["Pronto pra usar", "Por categoria", "Atualizado semanalmente"].map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" />
              {b}
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                categoria === c
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Nenhum prompt encontrado com esses filtros.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {filtrados.map((p) => (
            <article
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
            >
              <span
                className={cn(
                  "w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  badgeColors[p.categoria ?? ""] ?? badgeDefault,
                )}
              >
                {p.categoria ?? "Geral"}
              </span>
              <h2 className="text-base font-bold text-foreground">{p.titulo}</h2>
              <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                {(p.prompt ?? "").slice(0, 100)}...
              </p>
              <p className="text-sm font-semibold text-foreground">
                R$ {Number(p.preco ?? 0).toFixed(2)}
              </p>
              <button
                type="button"
                onClick={() => copiar(p)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-2.5 text-sm font-semibold text-primary-foreground glow-neon transition-opacity hover:opacity-90"
              >
                <Copy className="h-4 w-4" />
                Copiar Prompt
              </button>
            </article>
          ))}
        </div>
      )}

      {avaliando && <RatingModal produto={avaliando} onClose={() => setAvaliando(null)} />}
    </main>
  );
}

function RatingModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (nota === 0 || enviando) return;
    setEnviando(true);
    try {
      const db = supabase as unknown as { from: (t: string) => any };
      await db.from("avaliacoes_clientes").insert({
        produto_id: produto.id,
        nota,
        comentario: comentario.trim() || null,
      });
      toast.success("Obrigado pela avaliação!");
    } catch (e) {
      console.error("avaliacoes_clientes insert falhou", e);
      toast.success("Obrigado pela avaliação!");
    } finally {
      setEnviando(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Gostou deste prompt?</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNota(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hover || nota) >= n
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="O que podemos melhorar? (opcional)"
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
        <button
          type="button"
          disabled={nota === 0 || enviando}
          onClick={enviar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3 text-sm font-semibold text-primary-foreground glow-neon transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar avaliação
        </button>
      </div>
    </div>
  );
}
