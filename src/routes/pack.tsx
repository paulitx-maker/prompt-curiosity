import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Copy, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface Produto { id: string; titulo: string | null; prompt: string | null; categoria: string | null; preco: number | string | null; }

let _packClient: any = null;
function packClient() {
  if (_packClient) return _packClient;
  try {
    const env: any = (import.meta as any).env || {};
    // tenta PACK primeiro, se não tiver usa o SUPABASE normal do seu .env
    const url = env.VITE_PACK_SUPABASE_URL || env.PACK_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const key = env.VITE_PACK_SUPABASE_ANON_KEY || env.PACK_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      console.warn("Sem SUPABASE no .env");
      return null;
    }
    _packClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return _packClient;
  } catch {
    return null;
  }
}

async function fetchPack(): Promise<Produto[]> {
  try {
    const db = packClient();
    if (!db) return [];
    // tenta a view primeiro
    const packRes = await db.from("vw_pack_venda").select("*").eq("ativo", true).order("categoria");
    if (!packRes.error && packRes.data && packRes.data.length > 0) return packRes.data;
    // fallback pra tabela produtos
    const res = await db.from("produtos").select("id,titulo,prompt,categoria,preco").eq("ativo", true).order("categoria");
    if (res.error) {
      console.error("Supabase erro", res.error);
      return [];
    }
    return res.data ?? [];
  } catch (e) {
    console.error("fetchPack erro", e);
    return [];
  }
}

const packQueryOptions = queryOptions({ queryKey: ["pack-venda"], queryFn: fetchPack, staleTime: 60_000 });
export const Route = createFileRoute("/pack")({ loader: ({ context }) => context.queryClient.ensureQueryData(packQueryOptions), component: PackPage });

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
    const db = packClient();
    if (db) {
      try { await db.from("intencoes_compra").insert({ produto_id: p.id, etapa: "click_copiar" }); } catch {}
    }
    setTimeout(() => setAvaliando(p), 500);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 pb-16 pt-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold">Brazilian Prompt Pack</h1>
        <p className="text-sm text-muted-foreground">Copie e cole no ChatGPT, Claude, Gemini.</p>
        {produtos.length === 0 && <p className="text-xs text-orange-400">Nenhum produto encontrado - verifique se a tabela produtos tem dados e ativo=true</p>}
      </header>
      <div className="mt-8 flex flex-wrap gap-2">
        {["Todas","Marketing","Vendas","Juridico","RH","Produtividade"].map((c) => (
          <button key={c} onClick={() => setCategoria(c)} className={cn("rounded-full border px-3.5 py-1.5 text-xs", categoria === c ? "border-primary/60 bg-primary/15 text-primary" : "border-border bg-surface")}>{c}</button>
        ))}
      </div>
      <div className="mt-4 relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="w-full rounded-xl border bg-surface py-2.5 pl-10 pr-4 text-sm" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {filtrados.map((p: any) => (
          <article key={p.id} className="flex flex-col gap-3 rounded-2xl border bg-surface p-5">
            <span className="w-fit rounded-full border px-2.5 py-0.5 text-xs">{p.categoria ?? "Geral"}</span>
            <h2 className="font-bold">{p.titulo}</h2>
            <p className="flex-1 text-xs text-muted-foreground">{(p.prompt ?? "").slice(0, 100)}...</p>
            <p className="text-sm font-semibold">R$ {Number(p.preco ?? 0).toFixed(2)}</p>
            <button onClick={() => copiar(p)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"><Copy className="h-4 w-4" />Copiar Prompt</button>
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
    const db = packClient();
    if (db) {
      try { await db.from("avaliacoes_clientes").insert({ produto_id: produto.id, nota, comentario: comentario.trim() || null }); } catch {}
    }
    toast.success("Obrigado!");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between"><h3 className="font-bold">Gostou?</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="flex justify-center gap-1.5">{[1,2,3,4,5].map((n) => (<button key={n} onClick={() => setNota(n)}><Star className={cn("h-8 w-8", nota >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} /></button>))}</div>
        <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
        <button disabled={nota === 0} onClick={enviar} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Enviar</button>
      </div>
    </div>
  );
}