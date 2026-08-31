import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export interface PackProduto {
  id: string;
  titulo: string | null;
  prompt: string | null;
  categoria: string | null;
  preco: number | string | null;
}

function packClient() {
  const url = process.env["PACK_SUPABASE_URL"];
  const key = process.env["PACK_SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Supabase externo não configurado.");
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getPack = createServerFn({ method: "GET" }).handler(async (): Promise<PackProduto[]> => {
  const db = packClient();
  const { data: pack, error } = await db
    .from("vw_pack_venda")
    .select("*")
    .eq("ativo", true)
    .order("categoria");
  if (!error && pack && pack.length > 0) {
    console.log("[/pack] fonte: vw_pack_venda");
    return pack as PackProduto[];
  }
  console.log("[/pack] fonte: produtos (fallback)");
  const { data: produtos, error: err2 } = await db
    .from("produtos")
    .select("id,titulo,prompt,categoria,preco")
    .eq("ativo", true)
    .order("categoria");
  if (err2) throw new Error(err2.message);
  return (produtos ?? []) as PackProduto[];
});

export const registrarIntencao = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ produtoId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const db = packClient();
      await db.from("intencoes_compra").insert({ produto_id: data.produtoId, etapa: "click_copiar" });
    } catch (e) {
      console.error("intencoes_compra insert falhou", e);
    }
    return { ok: true };
  });

export const enviarAvaliacao = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        produtoId: z.string(),
        nota: z.number().int().min(1).max(5),
        comentario: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const db = packClient();
      await db.from("avaliacoes_clientes").insert({
        produto_id: data.produtoId,
        nota: data.nota,
        comentario: data.comentario?.trim() || null,
      });
    } catch (e) {
      console.error("avaliacoes_clientes insert falhou", e);
    }
    return { ok: true };
  });
