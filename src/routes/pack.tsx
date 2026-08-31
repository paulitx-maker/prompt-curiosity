import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface Produto { id: string; titulo: string | null; prompt: string | null; categoria: string | null; preco: number | string | null; }

let _packClient: any = null;
function packClient() {
  if (_packClient) return _packClient;
  const url = (import.meta as any).env?.VITE_PACK_SUPABASE_URL;
  const key = (import.meta as any).env?.VITE_PACK_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Configure VITE_PACK_ no .env");
  _packClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _packClient;
}

async function fetchPack(): Promise<Produto[]> {
  const db = packClient() as any;
  const { data: pack } = await db.from("vw_pack_venda").select("*").eq("ativo", true).order("categoria");
  if (pack && pack.length > 0) return pack;
  const { data } = await db.from("produtos").select("id,titulo,prompt,categoria,preco").eq("ativo", true).order("categoria");
  return data ?? [];
}

const packQueryOptions = queryOptions({ queryKey: ["pack-venda"], queryFn: fetchPack, staleTime: 60_000 });
export const Route = createFileRoute("/pack")({ loader: ({ context }) => context.queryClient.ensureQueryData(packQueryOptions), component: PackPage });

const categoriaCores: Record<string, string> = {
  Marketing: "border-purple-500/40 bg-purple-500/15 text-purple-300",
  Vendas: "border-green-500/40 bg-green-500/15 text-green-300",
  Juridico: "border-blue-500/40 bg-blue-500/15 text-blue-300",
  RH: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Produtividade: "border-gray-500/40 bg-gray-500/15 text-gray-300",
};

function PackPage() {
  const { data: produtos } = useSuspenseQuery(packQueryOptions);
  const [categoria, setCategoria] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [avaliando, setAvaliando] = useState<Produto | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p: any) => {
      if (categoria !== "Todas" && p.categoria !== categoria) return false;
      if (termo && !(p.titulo ?? "").toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [produtos, categoria, busca]);

  const copiar = async (p: Produto) => {
    await navigator.clipboard.writeText(p.prompt ?? "");
    toast.success("Prompt copiado!");
    try { await packClient().from("intencoes_compra").insert({ produto_id: p.id, etapa: "click_copiar" }); } catch {}
    setTimeout(() => setAvaliando(p), 500);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 pb-16 pt-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Brazilian Prompt Pack - <span className="text-gradient-neon">Mais de 50 Prompts que Vendem</span></h1>
        <p className="text-sm text-muted-foreground">Copie e cole no ChatGPT, Claude, Gemini. Testado em clientes reais.</p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" />Pronto pra usar</span>
          <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" />Por categoria</span>
          <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" />Atualizado semanalmente</span>
        </div>
      </header>
      <div className="mt-8 flex flex-wrap gap-2">
        {["Todas","Marketing","Vendas","Juridico","RH","Produtividade"].map((c) => (
          <button key={c} onClick={() => setCategoria(c)} className={cn("rounded-full border px-3.5 py-1.5 text-xs", categoria === c ? "border-primary/60 bg-primary/15 text-primary" : "border-border bg-surface text-muted-foreground")}>{c}</button>
        ))}
      </div>
      <div className="mt-4 relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="w-full rounded-xl border bg-surface py-2.5 pl-10 pr-4 text-sm" /></div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {filtrados.map((p: any) => (
          <article key={p.id} className="flex flex-col gap-3 rounded-2xl border bg-surface p-5">
            <span className={cn("w-fit rounded-full border px-2.5 py-0.5 text-xs", categoriaCores[p.categoria ?? ""] ?? categoriaCores.Produtividade)}>{p.categoria ?? "Geral"}</span>
            <h2 className="font-bold">{p.titulo}</h2>
            <p className="flex-1 text-xs text-muted-foreground">{(p.prompt ?? "").slice(0, 100)}...</p>
            <p className="text-sm font-semibold">R$ {Number(p.preco ?? 0).toFixed(2)}</p>
            <button onClick={() => copiar(p)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-2.5 text-sm font-semibold"><Copy className="h-4 w-4" />Copiar Prompt</button>
          </article>
        ))}
      </div>
      {avaliando && <RatingModal produto={avaliando} onClose={() => setAvaliando(null)} />}
    </main>
  );
}

function RatingModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const enviar = async () => {
    if (nota === 0) return;
    try { await packClient().from("avaliacoes_clientes").insert({ produto_id: produto.id, nota, comentario: comentario.trim() || null }); } catch {}
    toast.success("Obrigado!");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between"><h3 className="font-bold">Gostou?</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="flex justify-center gap-1.5">{[1,2,3,4,5].map((n) => (<button key={n} onClick={() => setNota(n)}><Star className={cn("h-8 w-8", nota >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} /></button>))}</div>
        <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
        <button disabled={nota === 0} onClick={enviar} className="w-full rounded-xl bg-gradient-neon px-4 py-3 text-sm font-semibold disabled:opacity-40">Enviar</button>
      </div>
    </div>
  );
}