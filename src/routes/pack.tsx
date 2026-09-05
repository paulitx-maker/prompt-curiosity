import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "@/hooks/use-device-id";
import { useTracking } from "@/hooks/use-tracking";
import { useCredits } from "@/hooks/use-credits";

export const Route = createFileRoute("/pack")({ component: PackPage });

interface Produto { id: string; titulo: string | null; prompt: string | null; categoria: string | null; preco: number | string | null; slug: string | null; ativo: boolean | null; }

function PackPage() {
  const { getId } = useDeviceId();
  const { track } = useTracking();
  const { consume } = useCredits();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [avaliando, setAvaliando] = useState<Produto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [consuming, setConsuming] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const dId = getId();
      const [{ data, error }, { data: u }] = await Promise.all([
        supabase.from("produtos").select("*").eq("ativo", true).order("created_at", { ascending: false }),
        supabase.from("users").select("credits").eq("device_id", dId).single()
      ]);
      if (error) setErro(error.message);
      setProdutos((data as any) || []);
      setCredits(u?.credits?? 0);
      setLoading(false);
      track('view_pack', { metadata: { total: data?.length } } as any);
    })();
    const h = async () => {
      const { data } = await supabase.from("users").select("credits").eq("device_id", getId()).single();
      if(data) setCredits(data.credits);
    };
    window.addEventListener("credits-updated", h);
    return () => window.removeEventListener("credits-updated", h);
  }, []);

  const categorias = useMemo(() => {
    const cats = new Set(produtos.map(p => p.categoria).filter(Boolean) as string[]);
    return ["Todas",...Array.from(cats)];
  }, [produtos]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter(p => {
      if (categoria!== "Todas" && p.categoria!== categoria) return false;
      if (termo &&!(p.titulo || "").toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [produtos, categoria, busca]);

  // FIX: recebe packId pra não ficar null no log
  const gastarCreditoLocal = async (tipo: string = 'copia_pack', packId?: string) => {
    const dId = getId();
    if (credits <= 0) {
      await track('click_copiar_bloqueado' as any, { pack_id: packId, tipo });
      window.dispatchEvent(new Event("abrir-paywall"));
      throw new Error("SEM_CREDITO");
    }
    const { data: novoSaldo, error } = await supabase.rpc('charge_credit', { _device_id: dId, _custo: 1 } as any);
    if (error || novoSaldo === null || novoSaldo < 0) {
      // não dispara paywall de novo pra não duplicar toast
      throw new Error("SEM_CREDITO");
    }
    setCredits(novoSaldo);
    window.dispatchEvent(new Event("credits-updated"));
    return novoSaldo;
  };

  const copiar = async (p: Produto) => {
    if (consuming) return;
    const dId = getId();
    const fullText = p.prompt || "";

    try {
      setConsuming(p.id);
      const gastar = (window as any).orquestradorGastarCredito || gastarCreditoLocal;
      // FIX: passa pack id
      const novoSaldo = await gastar('copia_pack', p.id);

      await track('click_copiar_full', { pack_id: p.id } as any);

      await supabase.from('credit_transactions').insert({
        device_id: dId, tipo: 'consumo_copia', pack_id: p.id, prompt_id: p.id, qtd: -1, saldo_antes: credits, saldo_depois: novoSaldo?? credits -1
      } as any);

      await navigator.clipboard.writeText(fullText);
      toast.success("Prompt COMPLETO copiado! 🔥");
      setTimeout(() => setAvaliando(p), 600);
    } catch (e: any) {
      if (e.message === 'SEM_CREDITO') {
        toast.error("Sem créditos. Desbloqueie por R$1,99");
      } else {
        toast.error(e.message);
      }
    } finally {
      setConsuming(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm">Carregando pack...</div>;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 pb-28 pt-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold">Brazilian Prompt Pack</h1>
        <p className="text-sm text-muted-foreground">Créditos: {credits} - A partir de R$4,90</p>
        {erro && <p className="text-xs text-red-400 p-3 border border-red-500/30 rounded-xl">Erro: {erro}</p>}
      </header>
      <div className="mt-8 flex flex-wrap gap-2">
        {categorias.map(c => (
          <button key={c} onClick={() => setCategoria(c)} className={cn("rounded-full border px-3.5 py-1.5 text-xs capitalize", categoria === c? "border-primary bg-primary/15 text-primary" : "border-border")}>{c}</button>
        ))}
      </div>
      <div className="mt-4 relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." className="w-full rounded-xl border bg-surface py-2.5 pl-10 pr-4 text-sm" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {filtrados.map(p => (
          <article key={p.id} className="flex flex-col gap-3 rounded-2xl border bg-surface p-5">
            <span className="w-fit rounded-full border px-2.5 py-0.5 text-xs">{p.categoria || "Geral"}</span>
            <h2 className="font-bold line-clamp-2">{p.titulo}</h2>
            <p className="flex-1 text-xs text-muted-foreground line-clamp-3">{(p.prompt || "").slice(0, 120)}...</p>
            <p className="text-sm font-semibold">R$ {Number(p.preco || 0).toFixed(2)}</p>
            <button disabled={consuming === p.id} onClick={() => copiar(p)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Copy className="h-4 w-4" />{consuming === p.id? "..." : "Copiar Prompt"}
            </button>
          </article>
        ))}
      </div>
      {avaliando && <RatingModal produto={avaliando} onClose={() => setAvaliando(null)} />}
    </main>
  );
}

function RatingModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const [nota, setNota] = useState(0);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { getId } = useDeviceId();
  const enviar = async () => {
    if (nota === 0) return;
    setEnviando(true);
    const { error } = await supabase.from("feedbacks").insert({ device_id: getId(), execution_id: null, nota, o_que_faltou: texto.trim() || null } as any);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Obrigado!"); onClose(); }
    setEnviando(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-surface p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="font-bold text-sm">Gostou de {produto.titulo}?</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="flex justify-center gap-1.5">{[1,2,3,4,5].map(n => (<button key={n} onClick={() => setNota(n)}><Star className={cn("h-8 w-8 transition", nota >= n? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} /></button>))}</div>
        {nota > 0 && nota <= 3 && (<div className="space-y-2"><label className="text-xs text-muted-foreground">O que faltou?</label><textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Me diz o que podemos melhorar..." className="w-full rounded-xl border bg-background p-3 text-sm min-h-[80px]" /></div>)}
        <button disabled={nota===0 || enviando} onClick={enviar} className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-3 text-sm font-semibold disabled:opacity-40">{enviando? "Enviando..." : "Enviar avaliação"}</button>
        <button onClick={onClose} className="w-full rounded-xl border border-border bg-transparent py-2.5 text-sm">Cancelar</button>
      </div>
    </div>
  );
}