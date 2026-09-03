//#region node_modules/.nitro/vite/services/ssr/assets/admin.server-BckwV3O6.js
async function runAdminDashboard(adminKey) {
	const expected = process.env["ADMIN_ACCESS_KEY"];
	if (!expected) return {
		ok: false,
		message: "ADMIN_ACCESS_KEY não está configurada no backend."
	};
	if (!adminKey || adminKey !== expected) return {
		ok: false,
		message: "Chave de acesso inválida."
	};
	const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
	const [usersRes, execCountRes, execRowsRes, feedbackRes] = await Promise.all([
		supabaseAdmin.from("users").select("id, device_id, credits"),
		supabaseAdmin.from("executions").select("id", {
			count: "exact",
			head: true
		}),
		supabaseAdmin.from("executions").select("id, created_at, tipo, modelo_usado, tema_extraido, custo_usd, user_id").order("created_at", { ascending: false }).limit(200),
		supabaseAdmin.from("feedbacks").select("id, created_at, nota, o_que_faltou, execution_id").lte("nota", 3).order("created_at", { ascending: false }).limit(50)
	]);
	const users = usersRes.data ?? [];
	const deviceById = new Map(users.map((u) => [u.id, u.device_id]));
	const allExecs = execRowsRes.data ?? [];
	const custoUsd = allExecs.reduce((sum, e) => sum + Number(e.custo_usd ?? 0), 0);
	const creditos = users.reduce((sum, u) => sum + Number(u.credits ?? 0), 0);
	const execucoes = allExecs.slice(0, 20).map((e) => ({
		id: e.id,
		created_at: e.created_at,
		tipo: e.tipo,
		modelo_usado: e.modelo_usado,
		tema_extraido: e.tema_extraido ? e.tema_extraido.slice(0, 80) : null,
		custo_usd: e.custo_usd === null ? null : Number(e.custo_usd),
		device_id: e.user_id ? deviceById.get(e.user_id) ?? null : null
	}));
	const feedbacks = feedbackRes.data ?? [];
	let custoDiario = null;
	let custoDiarioAviso = "custo_ia está no Supabase externo — confira o painel do OpenRouter.";
	const viewRes = await supabaseAdmin.from("vw_custo_diario").select("*").limit(30);
	if (!viewRes.error && Array.isArray(viewRes.data) && viewRes.data.length > 0) {
		custoDiario = viewRes.data.map((r) => ({
			dia: String(r["dia"] ?? r["day"] ?? r["data"] ?? ""),
			custo: Number(r["custo"] ?? r["custo_usd"] ?? r["total"] ?? 0)
		}));
		custoDiarioAviso = null;
	}
	return {
		ok: true,
		totals: {
			execucoes: execCountRes.count ?? allExecs.length,
			devices: users.length,
			custoUsd: Number(custoUsd.toFixed(6)),
			creditos
		},
		execucoes,
		feedbacks,
		custoDiario,
		custoDiarioAviso
	};
}
//#endregion
export { runAdminDashboard };
