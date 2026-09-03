import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as Search, d as Copy, r as Star, t as X } from "../_libs/lucide-react.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pack-B8d6gkTN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function getSupabase() {
	if (typeof window === "undefined") return null;
	const env = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/",
		"VITE_PACK_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jdWt4bnhwaWF5aXRram12am52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NjYyNDMsImV4cCI6MjEwMzQ0MjI0M30.kkJxDINHuEQZ73Qk5xdr1vNoLXm_4TtZcLpj4CaB65Q",
		"VITE_PACK_SUPABASE_URL": "https://mcukxnxpiayitkjmvjnv.supabase.co",
		"VITE_SUPABASE_PROJECT_ID": "okihhrxsedcnfgcbgsep",
		"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_s7hPFb6qivT14xkV5B5yHA_IgwhbY_h",
		"VITE_SUPABASE_URL": "https://c--82546c09-26c0-4014-805c-18bee6fe3f55-prod.lovable.cloud"
	};
	const url = env.VITE_SUPABASE_URL || env.VITE_PACK_SUPABASE_URL;
	const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
	if (!url || !key) return null;
	return createClient(url, key, { auth: {
		persistSession: false,
		storageKey: "pack-client"
	} });
}
function getDeviceId() {
	if (typeof window === "undefined") return "server";
	let id = localStorage.getItem("device_id");
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem("device_id", id);
	}
	return id;
}
async function logIntencao(produto, etapa) {
	const db = getSupabase();
	if (!db) return;
	await db.from("intencoes_compra").insert({
		device_id: getDeviceId(),
		produto_id: produto.id,
		categoria: produto.categoria,
		etapa,
		created_at: (/* @__PURE__ */ new Date()).toISOString()
	});
}
function PackPage() {
	const [produtos, setProdutos] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [categoria, setCategoria] = (0, import_react.useState)("Todas");
	const [busca, setBusca] = (0, import_react.useState)("");
	const [avaliando, setAvaliando] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		(async () => {
			const db = getSupabase();
			if (!db) {
				setLoading(false);
				return;
			}
			const { data } = await db.from("produtos").select("id,titulo,prompt,categoria,preco").eq("ativo", true).order("categoria");
			setProdutos(data || []);
			setLoading(false);
		})();
	}, []);
	const filtrados = (0, import_react.useMemo)(() => {
		const termo = busca.toLowerCase();
		return produtos.filter((p) => {
			if (categoria !== "Todas" && p.categoria !== categoria) return false;
			if (termo && !(p.titulo || "").toLowerCase().includes(termo)) return false;
			return true;
		});
	}, [
		produtos,
		categoria,
		busca
	]);
	const copiar = async (p) => {
		await navigator.clipboard.writeText(p.prompt || "");
		toast.success("Prompt copiado!");
		await logIntencao(p, "copiou");
		setTimeout(() => setAvaliando(p), 500);
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-10 text-center text-sm",
		children: "Carregando pack..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen w-full max-w-5xl px-5 pb-16 pt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "space-y-3 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-bold",
						children: "Brazilian Prompt Pack"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Copie e cole no ChatGPT, Claude, Gemini - R$4,90"
					}),
					produtos.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-orange-400 p-3 border rounded-xl",
						children: "Nenhum produto com ativo=true no Supabase."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 flex flex-wrap gap-2",
				children: [
					"Todas",
					"Marketing",
					"Vendas",
					"Juridico",
					"RH",
					"Produtividade"
				].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setCategoria(c),
					className: cn("rounded-full border px-3.5 py-1.5 text-xs", categoria === c ? "border-primary bg-primary/15 text-primary" : "border-border"),
					children: c
				}, c))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: busca,
					onChange: (e) => setBusca(e.target.value),
					placeholder: "Buscar...",
					className: "w-full rounded-xl border bg-surface py-2.5 pl-10 pr-4 text-sm"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid grid-cols-1 gap-4 md:grid-cols-3",
				children: filtrados.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "flex flex-col gap-3 rounded-2xl border bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-fit rounded-full border px-2.5 py-0.5 text-xs",
							children: p.categoria || "Geral"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-bold",
							children: p.titulo
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex-1 text-xs text-muted-foreground line-clamp-3",
							children: [(p.prompt || "").slice(0, 100), "..."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-semibold",
							children: ["R$ ", Number(p.preco || 0).toFixed(2)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => copiar(p),
							className: "flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), "Copiar Prompt"]
						})
					]
				}, p.id))
			}),
			avaliando && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatingModal, {
				produto: avaliando,
				onClose: () => setAvaliando(null)
			})
		]
	});
}
function RatingModal({ produto, onClose }) {
	const [nota, setNota] = (0, import_react.useState)(0);
	const [texto, setTexto] = (0, import_react.useState)("");
	const [enviando, setEnviando] = (0, import_react.useState)(false);
	const enviar = async () => {
		if (nota === 0) return;
		setEnviando(true);
		const db = getSupabase();
		const deviceId = getDeviceId();
		const { error } = await db.from("feedbacks").insert({
			device_id: deviceId,
			execution_id: null,
			nota,
			o_que_faltou: texto.trim() || null
		});
		if (error) toast.error("Erro: " + error.message);
		else {
			await logIntencao(produto, `avaliou_nota_${nota}`);
			toast.success("Obrigado!");
			onClose();
		}
		setEnviando(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm space-y-4 rounded-2xl border bg-surface p-6",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-sm",
						children: [
							"Gostou de ",
							produto.titulo,
							"?"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center gap-1.5",
					children: [
						1,
						2,
						3,
						4,
						5
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setNota(n),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("h-8 w-8 transition", nota >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground") })
					}, n))
				}),
				nota > 0 && nota <= 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs text-muted-foreground",
						children: "O que faltou?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: texto,
						onChange: (e) => setTexto(e.target.value),
						placeholder: "Me diz o que podemos melhorar...",
						className: "w-full rounded-xl border bg-background p-3 text-sm min-h-[80px]"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: nota === 0 || enviando,
					onClick: enviar,
					className: "w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-40",
					children: enviando ? "Enviando..." : "Enviar avaliação"
				})
			]
		})
	});
}
//#endregion
export { PackPage as component };
