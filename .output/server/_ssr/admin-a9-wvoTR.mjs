import { r as __toESM } from "../_runtime.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as useServerFn, t as createSsrRpc } from "./createSsrRpc-CH4dIhkL.mjs";
import { c as Lock, l as LoaderCircle, o as RefreshCw } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-a9-wvoTR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var getAdminDashboard = createServerFn({ method: "POST" }).inputValidator((input) => input).handler(createSsrRpc("bd91712aa12a864ae43341e860d6d1c64b91b59ae5ce60ea0dbdc10eee9819c1"));
var STORAGE_KEY = "admin_key";
function Card({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] uppercase tracking-wider text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xl font-semibold text-foreground",
			children: value
		})]
	});
}
function Admin() {
	const load = useServerFn(getAdminDashboard);
	const [keyInput, setKeyInput] = (0, import_react.useState)("");
	const [data, setData] = (0, import_react.useState)(null);
	const [erro, setErro] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const fetchData = async (adminKey) => {
		setLoading(true);
		setErro(null);
		try {
			const res = await load({ data: { adminKey } });
			if (!res.ok) {
				setErro(res.message);
				setData(null);
				window.localStorage.removeItem(STORAGE_KEY);
			} else {
				window.localStorage.setItem(STORAGE_KEY, adminKey);
				setData(res);
			}
		} catch {
			setErro("Não consegui carregar o painel. Tenta de novo.");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (saved) fetchData(saved);
	}, []);
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto min-h-screen w-full max-w-md px-5 pt-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 rounded-2xl border border-border bg-surface p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-sm font-semibold text-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4 text-primary" }), "Backoffice"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "password",
					value: keyInput,
					onChange: (e) => setKeyInput(e.target.value),
					placeholder: "Chave de acesso",
					className: "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: loading || !keyInput,
					onClick: () => void fetchData(keyInput),
					className: "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3 text-sm font-semibold text-primary-foreground glow-neon disabled:opacity-40 disabled:shadow-none",
					children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Entrar"]
				}),
				erro && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-destructive",
					children: erro
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen w-full max-w-3xl px-5 pb-16 pt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-2xl font-bold tracking-tight",
					children: ["Back", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-gradient-neon",
						children: "office"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => void fetchData(window.localStorage.getItem(STORAGE_KEY) ?? ""),
					className: "inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground",
					children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5" }), "Atualizar"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						label: "Execuções",
						value: String(data.totals.execucoes)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						label: "Dispositivos",
						value: String(data.totals.devices)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						label: "Custo total",
						value: `$${data.totals.custoUsd.toFixed(6)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						label: "Créditos restantes",
						value: String(data.totals.creditos)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-foreground",
					children: "Últimas 20 execuções"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 overflow-x-auto rounded-2xl border border-border bg-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "Quando"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "Tipo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "Modelo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "Tema"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "Custo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "Device"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [data.execucoes.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 6,
							className: "px-3 py-4 text-muted-foreground",
							children: "Nenhuma execução registrada ainda."
						}) }), data.execucoes.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/50 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-3 py-2 text-muted-foreground",
									children: new Date(e.created_at).toLocaleString("pt-BR")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-3 py-2 text-foreground",
									children: e.tipo ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-3 py-2 text-muted-foreground",
									children: e.modelo_usado ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-muted-foreground",
									children: e.tema_extraido ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "whitespace-nowrap px-3 py-2 text-primary",
									children: ["$", (e.custo_usd ?? 0).toFixed(6)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-3 py-2 text-muted-foreground",
									children: e.device_id ? `${e.device_id.slice(0, 8)}…` : "—"
								})
							]
						}, e.id))] })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-foreground",
					children: "Feedbacks negativos (nota ≤ 3)"
				}), data.feedbacks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl border border-border bg-surface p-4 text-xs text-muted-foreground",
					children: "Nenhum feedback negativo até agora."
				}) : data.feedbacks.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Nota ",
							f.nota ?? "—",
							" · ",
							new Date(f.created_at).toLocaleString("pt-BR")
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-foreground",
						children: f.o_que_faltou?.trim() || "Sem comentário."
					})]
				}, f.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-foreground",
					children: "Custo diário"
				}), data.custoDiario ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 divide-y divide-border rounded-2xl border border-border bg-surface",
					children: data.custoDiario.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between px-4 py-2.5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: d.dia
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-primary",
							children: ["$", d.custo.toFixed(6)]
						})]
					}, d.dia))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-2xl border border-border bg-surface p-4 text-xs text-muted-foreground",
					children: data.custoDiarioAviso
				})]
			})
		]
	});
}
//#endregion
export { Admin as component };
