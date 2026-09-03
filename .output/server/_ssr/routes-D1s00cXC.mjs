import { r as __toESM } from "../_runtime.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as useServerFn, t as createSsrRpc } from "./createSsrRpc-CH4dIhkL.mjs";
import { c as Lock, d as Copy, f as ChevronDown, i as Sparkles, l as LoaderCircle, m as AudioLines, n as TriangleAlert, p as Check, r as Star, s as Mic, u as Image$1 } from "../_libs/lucide-react.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D1s00cXC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DropZone({ accept, title, hint, icon, onFile, disabled }) {
	const inputRef = (0, import_react.useRef)(null);
	const [over, setOver] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		disabled,
		onClick: () => inputRef.current?.click(),
		onDragOver: (e) => {
			e.preventDefault();
			setOver(true);
		},
		onDragLeave: () => setOver(false),
		onDrop: (e) => {
			e.preventDefault();
			setOver(false);
			const file = e.dataTransfer.files?.[0];
			if (file) onFile(file);
		},
		className: cn("flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition-all", over ? "border-primary bg-primary/10 glow-soft" : "border-border bg-surface hover:border-primary/50", disabled && "pointer-events-none opacity-50"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-neon text-primary-foreground glow-soft",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-semibold text-foreground",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "max-w-[16rem] text-xs text-muted-foreground",
				children: hint
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref: inputRef,
		type: "file",
		accept,
		className: "hidden",
		onChange: (e) => {
			const file = e.target.files?.[0];
			if (file) onFile(file);
			e.target.value = "";
		}
	})] });
}
var postImagem = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("816638c986f2c6721146cdfeee04c9b8718c79d14f538d8aae3cc79bff1094b1"));
var audioResumo = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("65c4eb2d8b28ef037702a89e0b5d3ff1f9603aa950a6103f64067c7264a66cb3"));
var enviarFeedback = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("3a91425a94bddd14612a94d757e8a42705d21fff6414a6a2dc2de4f0c6102615"));
function getDeviceId() {
	if (typeof window === "undefined") return "";
	let id = localStorage.getItem("device_id");
	if (id) {
		document.cookie = `device_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
		return id;
	}
	const cookieMatch = document.cookie.match(/device_id=([^;]+)/);
	if (cookieMatch && cookieMatch[1]) {
		localStorage.setItem("device_id", cookieMatch[1]);
		return cookieMatch[1];
	}
	id = crypto.randomUUID();
	localStorage.setItem("device_id", id);
	document.cookie = `device_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
	return id;
}
function FeedbackBar({ executionId }) {
	const send = useServerFn(enviarFeedback);
	const [nota, setNota] = (0, import_react.useState)(0);
	const [hover, setHover] = (0, import_react.useState)(0);
	const [texto, setTexto] = (0, import_react.useState)("");
	const [podeUsar, setPodeUsar] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [enviado, setEnviado] = (0, import_react.useState)(false);
	const enviar = async () => {
		if (nota === 0) return;
		setLoading(true);
		try {
			const deviceId = getDeviceId();
			await send({ data: {
				executionId,
				deviceId,
				nota,
				oQueFaltou: texto.trim() || void 0,
				podeUsarPublico: podeUsar
			} });
			setEnviado(true);
		} finally {
			setLoading(false);
		}
	};
	if (enviado) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "rounded-2xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground",
		children: [
			"Valeu! Nota ",
			nota,
			" salva ",
			podeUsar ? "e liberado pra galeria anônima." : " - só uso interno.",
			" Isso calibra o Pack."
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 rounded-2xl border border-border bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium text-muted-foreground",
					children: "Quanto esse resultado resolveu? (1-5)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1",
					children: [
						1,
						2,
						3,
						4,
						5
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onMouseEnter: () => setHover(n),
						onMouseLeave: () => setHover(0),
						onClick: () => {
							setNota(n);
							if (n >= 4) setPodeUsar(true);
						},
						className: "p-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-7 w-7 transition-colors ${(hover || nota) >= n ? "fill-primary text-primary" : "text-muted-foreground"}` })
					}, n))
				})]
			}),
			nota > 0 && nota <= 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: texto,
				onChange: (e) => setTexto(e.target.value),
				placeholder: "O que faltou pra ser 5?",
				rows: 2,
				className: "w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
			}),
			nota > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: podeUsar,
					onChange: (e) => setPodeUsar(e.target.checked),
					className: "mt-0.5"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground",
					children: "Pode usar meu post como exemplo anônimo na galeria? (sem seu nome/foto, só o texto gerado)"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: loading || nota === 0,
				onClick: enviar,
				className: "w-full rounded-xl bg-gradient-neon px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : `Enviar nota ${nota}`
			})] })
		]
	});
}
function Segmented({ label, options, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
			className: "text-sm font-medium text-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-2",
			children: options.map((option) => {
				const active = value === option.value;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onChange(option.value),
					className: cn("rounded-xl border px-3 py-3 text-xs font-medium transition-all", active ? "border-transparent bg-gradient-neon text-primary-foreground glow-soft" : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"),
					children: option.label
				}, option.value);
			})
		})]
	});
}
var STEPS = [
	"Upload",
	"Perguntas",
	"Resultado"
];
function Steps({ current }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "flex items-center gap-2",
		children: STEPS.map((label, index) => {
			const step = index + 1;
			const active = step === current;
			const done = step < current;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-1 items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all", active && "bg-gradient-neon text-primary-foreground glow-soft", done && "bg-primary/20 text-primary", !active && !done && "bg-secondary text-muted-foreground"),
					children: step
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground"),
					children: label
				})]
			}, label);
		})
	});
}
function ResultCard({ title, content, collapsible = false, defaultOpen = true }) {
	const [open, setOpen] = (0, import_react.useState)(defaultOpen);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const copy = async () => {
		await navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 1800);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-surface p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => collapsible && setOpen((v) => !v),
				className: "flex items-center gap-2 text-sm font-semibold text-foreground",
				children: [title, collapsible && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180") })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: copy,
				className: "inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50",
				children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), copied ? "Copiado" : "Copiar"]
			})]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
			children: content
		})]
	});
}
async function checkImageQuality(file) {
	if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
		console.log("[HEIC_BLOCKED]", file.name);
		return {
			status: "block",
			message: "Seu iPhone mandou em HEIC e nosso modelo ainda não lê. Vai em Fotos > Exportar como JPEG e tenta de novo? Isso nos ajuda a saber quanta gente usa iPhone aqui."
		};
	}
	if (file.size < 40960) return {
		status: "block",
		message: "Essa imagem parece muito comprimida ou de baixa qualidade. Manda outra foto em resolução maior."
	};
	if (file.size > 8388608) return {
		status: "block",
		message: "Imagem acima de 8MB. Comprima ou escolha outra foto."
	};
	const dims = await readImageDimensions(file);
	if (!dims) return {
		status: "block",
		message: "Não consegui ler essa imagem. Tente outro arquivo."
	};
	if (dims.width < 500 || dims.height < 500) return {
		status: "block",
		message: `Resolução muito baixa (${dims.width}x${dims.height}px). Mínimo recomendado: 500x500px.`
	};
	return { status: "pass" };
}
function readImageDimensions(file) {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({
				width: img.naturalWidth,
				height: img.naturalHeight
			});
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(null);
		};
		img.src = url;
	});
}
async function checkAudioQuality(file) {
	const duration = await readAudioDuration(file);
	if (!duration || !Number.isFinite(duration) || duration < 2) return {
		status: "block",
		message: "Áudio vazio, corrompido ou tempo real não detectado."
	};
	if (duration > 3600) return {
		status: "block",
		message: "Áudio acima de 1h não é suportado nessa versão. Envie um trecho menor."
	};
	if (file.size * 8 / duration / 1e3 < 32) return {
		status: "block",
		message: "Qualidade de áudio muito baixa pra essa duração. Grave/exporte de novo com qualidade maior."
	};
	if (file.size > 26214400) return {
		status: "block",
		message: "Arquivo acima de 25MB. Comprima ou envie um trecho menor."
	};
	if (duration > 1200) return {
		status: "warn",
		message: "Áudio longo (+20min) — vai demorar mais e custar mais caro. Confirma?",
		durationSeconds: duration
	};
	return {
		status: "pass",
		durationSeconds: duration
	};
}
function readAudioDuration(file) {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const audio = document.createElement("audio");
		audio.preload = "metadata";
		audio.onloadedmetadata = () => {
			URL.revokeObjectURL(url);
			resolve(audio.duration);
		};
		audio.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(null);
		};
		audio.src = url;
	});
}
function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = String(reader.result);
			resolve(result.includes(",") ? result.split(",")[1] : result);
		};
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Falha ao ler o arquivo."));
		reader.readAsDataURL(file);
	});
}
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
	const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_PACK_SUPABASE_ANON_KEY;
	if (!url || !key) return null;
	return createClient(url, key, { auth: { persistSession: false } });
}
async function compressAndToBase64(file) {
	const bitmap = await createImageBitmap(file);
	const max = 1024;
	let { width, height } = bitmap;
	if (width > max || height > max) {
		const ratio = Math.min(max / width, max / height);
		width = Math.round(width * ratio);
		height = Math.round(height * ratio);
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
	return canvas.toDataURL("image/jpeg", .72);
}
function FotoPost() {
	const run = useServerFn(postImagem);
	const [stage, setStage] = (0, import_react.useState)(1);
	const [file, setFile] = (0, import_react.useState)(null);
	const [blocked, setBlocked] = (0, import_react.useState)(null);
	const [plataforma, setPlataforma] = (0, import_react.useState)(null);
	const [tom, setTom] = (0, import_react.useState)(null);
	const [manterTexto, setManterTexto] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [erro, setErro] = (0, import_react.useState)(null);
	const [post, setPost] = (0, import_react.useState)(null);
	const [custo, setCusto] = (0, import_react.useState)(null);
	const [executionId, setExecutionId] = (0, import_react.useState)(null);
	const [creditos, setCreditos] = (0, import_react.useState)(null);
	const reset = () => {
		setStage(1);
		setFile(null);
		setBlocked(null);
		setPlataforma(null);
		setTom(null);
		setManterTexto(null);
		setErro(null);
		setPost(null);
		setCusto(null);
		setExecutionId(null);
		setCreditos(null);
	};
	const handleFile = async (picked) => {
		setBlocked(null);
		const sizeMb = picked.size / 1024 / 1024;
		const isHeic = picked.type === "image/heic" || picked.type === "image/heif" || picked.name.toLowerCase().endsWith(".heic") || picked.name.toLowerCase().endsWith(".heif");
		if (isHeic || sizeMb > 5) try {
			const db = getSupabase();
			if (db) await db.from("monitor_arquivos").insert({
				device_id: getDeviceId(),
				file_name: picked.name,
				file_type: picked.type || "heic",
				file_size_mb: Number(sizeMb.toFixed(2)),
				motivo: isHeic ? "heic_detectado" : "maior_que_5mb"
			});
		} catch {}
		if (isHeic) {
			setBlocked("Seu iPhone mandou em HEIC e nosso modelo ainda não lê. Exporta como JPEG e tenta de novo? (Já logamos pra monitorar)");
			setFile(null);
			return;
		}
		const result = await checkImageQuality(picked);
		if (result.status === "block") {
			setBlocked(result.message);
			setFile(null);
			return;
		}
		setFile(picked);
		setStage(2);
	};
	const submit = async () => {
		if (!file || !plataforma || !tom || !manterTexto) return;
		setLoading(true);
		setErro(null);
		setStage(3);
		try {
			const b64 = await compressAndToBase64(file);
			const res = await run({ data: {
				imageBase64: b64,
				fileBase64: b64,
				mimeType: "image/jpeg",
				fileName: file.name,
				deviceId: getDeviceId(),
				answers: {
					plataforma,
					tom,
					manterTexto
				}
			} });
			if (!res.ok) throw new Error(res.message || "Erro no servidor");
			setPost(res.post || res.post_gerado || null);
			setCusto(res.custo_estimado ?? res.custo_usd ?? res.custo ?? null);
			setExecutionId(res.executionId ?? res.id ?? null);
			setCreditos(res.creditosRestantes ?? res.credits ?? null);
		} catch (e) {
			console.error(e);
			setErro(e.message?.includes("Too Large") ? "Foto muito grande, mas já comprimi. Tenta de novo." : e.message || "Algo quebrou. Tenta de novo.");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Steps, { current: stage }),
			stage === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, {
					accept: "image/*",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { className: "h-6 w-6" }),
					title: "Arraste uma foto ou toque para escolher",
					hint: "JPG ou PNG, mínimo 500x500px e 40KB",
					onFile: handleFile
				}), blocked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }), blocked]
				})]
			}),
			stage === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6 rounded-2xl border border-border bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						label: "Qual a plataforma?",
						value: plataforma,
						onChange: setPlataforma,
						options: [
							{
								value: "instagram",
								label: "Instagram"
							},
							{
								value: "linkedin",
								label: "LinkedIn"
							},
							{
								value: "whatsapp",
								label: "WhatsApp"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						label: "Qual o tom?",
						value: tom,
						onChange: setTom,
						options: [
							{
								value: "vendas",
								label: "Vendas"
							},
							{
								value: "informativo",
								label: "Informativo"
							},
							{
								value: "engracado",
								label: "Engraçado"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						label: "O texto da imagem deve ser mantido ou reescrito?",
						value: manterTexto,
						onChange: setManterTexto,
						options: [{
							value: "manter",
							label: "Manter"
						}, {
							value: "reescrever",
							label: "Reescrever"
						}]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !plataforma || !tom || !manterTexto,
						onClick: submit,
						className: "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3.5 text-sm font-semibold text-primary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "Gerar post"]
					})
				]
			}),
			stage === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 rounded-2xl border bg-surface p-6 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-primary" }), "Gerando seu post..."]
					}),
					erro && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
						children: [erro, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: reset,
							className: "ml-2 underline",
							children: "Tentar de novo"
						})]
					}),
					post && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
							title: "Post gerado",
							content: post
						}),
						executionId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedbackBar, { executionId }),
						custo !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"Custo estimado: $",
								custo.toFixed(6),
								" — Gemini 2.5 Flash Lite"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground/70",
							children: ["Custo: 1 crédito", creditos !== null ? ` · ${creditos} restantes` : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: reset,
							className: "w-full rounded-xl border bg-secondary px-4 py-3 text-sm",
							children: "Começar de novo"
						})
					] })
				]
			})
		]
	});
}
function AudioResumo() {
	const run = useServerFn(audioResumo);
	const [stage, setStage] = (0, import_react.useState)(1);
	const [file, setFile] = (0, import_react.useState)(null);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [blocked, setBlocked] = (0, import_react.useState)(null);
	const [warning, setWarning] = (0, import_react.useState)(null);
	const [numeroPessoas, setNumeroPessoas] = (0, import_react.useState)(null);
	const [ruido, setRuido] = (0, import_react.useState)(null);
	const [resultado, setResultado] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [erro, setErro] = (0, import_react.useState)(null);
	const [transcricao, setTranscricao] = (0, import_react.useState)(null);
	const [resumo, setResumo] = (0, import_react.useState)(null);
	const [custo, setCusto] = (0, import_react.useState)(null);
	const [executionId, setExecutionId] = (0, import_react.useState)(null);
	const reset = () => {
		setStage(1);
		setFile(null);
		setDuration(0);
		setBlocked(null);
		setWarning(null);
		setNumeroPessoas(null);
		setRuido(null);
		setResultado(null);
		setErro(null);
		setTranscricao(null);
		setResumo(null);
		setCusto(null);
		setExecutionId(null);
	};
	const handleFile = async (picked) => {
		setBlocked(null);
		setWarning(null);
		const result = await checkAudioQuality(picked);
		if (result.status === "block") {
			setBlocked(result.message);
			setFile(null);
			return;
		}
		setFile(picked);
		setDuration(result.durationSeconds ?? 0);
		if (result.status === "warn") {
			setWarning(result.message);
			return;
		}
		setStage(2);
	};
	const submit = async () => {
		if (!file || !numeroPessoas || !ruido || !resultado) return;
		setLoading(true);
		setErro(null);
		setStage(3);
		try {
			const audioBase64 = await fileToBase64(file);
			const res = await run({ data: {
				audioBase64,
				mimeType: file.type,
				fileName: file.name,
				deviceId: getDeviceId(),
				durationSeconds: duration,
				answers: {
					numeroPessoas,
					ruido,
					resultado
				}
			} });
			if (!res.ok) setErro(res.message);
			else {
				setTranscricao(res.transcricao);
				setResumo(res.resumo);
				setCusto(res.custo_estimado);
				setExecutionId(res.executionId ?? null);
			}
		} catch {
			setErro("Algo quebrou no caminho.");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Steps, { current: stage }),
			stage === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, {
						accept: "audio/*",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { className: "h-6 w-6" }),
						title: "Arraste um áudio",
						hint: "MP3, WAV, M4A ou OGG — até 25MB e 1h",
						onFile: handleFile
					}),
					blocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
						children: blocked
					}),
					warning && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning",
						children: [warning, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setWarning(null);
								setStage(2);
							},
							className: "ml-2 underline",
							children: "Continuar"
						})]
					})
				]
			}),
			stage === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6 rounded-2xl border bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						label: "Quantas pessoas falam?",
						value: numeroPessoas,
						onChange: setNumeroPessoas,
						options: [
							{
								value: "1",
								label: "1"
							},
							{
								value: "2",
								label: "2"
							},
							{
								value: "3_ou_mais",
								label: "3+"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						label: "Tem ruído?",
						value: ruido,
						onChange: setRuido,
						options: [
							{
								value: "limpo",
								label: "Limpo"
							},
							{
								value: "moderado",
								label: "Moderado"
							},
							{
								value: "muito_ruido",
								label: "Muito ruído"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						label: "Resultado final?",
						value: resultado,
						onChange: setResultado,
						options: [
							{
								value: "transcricao_literal",
								label: "Transcrição literal"
							},
							{
								value: "resumo_curto",
								label: "Resumo curto"
							},
							{
								value: "resumo_detalhado",
								label: "Resumo detalhado"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !numeroPessoas || !ruido || !resultado,
						onClick: submit,
						className: "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3.5 text-sm font-semibold text-primary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "Gerar resumo"]
					})
				]
			}),
			stage === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 rounded-2xl border bg-surface p-6 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-primary" }), "Transcrevendo..."]
					}),
					erro && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
						children: erro
					}),
					resumo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
							title: "Transcrição",
							content: transcricao ?? "",
							collapsible: true,
							defaultOpen: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
							title: "Resumo",
							content: resumo
						}),
						executionId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedbackBar, { executionId }),
						custo !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"Custo: $",
								custo.toFixed(6),
								" — Whisper + Gemini"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: reset,
							className: "w-full rounded-xl border bg-secondary px-4 py-3 text-sm",
							children: "Começar de novo"
						})
					] })
				]
			})
		]
	});
}
function Index() {
	const [tab, setTab] = (0, import_react.useState)("foto");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.2em] text-primary",
						children: "Aula 1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "text-3xl font-bold tracking-tight",
						children: ["Anti-", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gradient-neon",
							children: "Jegue"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Aqui você não escreve prompt. Responde 3 perguntas, a IA executa no modelo mais barato e você vê quanto custou."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setTab("foto"),
					className: cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab === "foto" ? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground hover:text-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { className: "h-4 w-4" }), "Foto → Post"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setTab("audio"),
					className: cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab === "audio" ? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground hover:text-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "h-4 w-4" }), "Áudio → Resumo"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-7",
				children: tab === "foto" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FotoPost, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioResumo, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-muted-foreground",
						children: "Próximas aulas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 rounded-2xl border bg-surface/60 p-4 opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }), " Aula 3 — Texto → Imagem"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 rounded-2xl border bg-surface/60 p-4 opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }), " Aula 4 — Ideia → Vídeo curto"]
					})
				]
			})
		]
	});
}
//#endregion
export { Index as component };
