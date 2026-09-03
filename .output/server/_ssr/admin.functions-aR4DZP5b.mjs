import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-aR4DZP5b.js
var getAdminDashboard_createServerFn_handler = createServerRpc({
	id: "bd91712aa12a864ae43341e860d6d1c64b91b59ae5ce60ea0dbdc10eee9819c1",
	name: "getAdminDashboard",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getAdminDashboard.__executeServer(opts));
var getAdminDashboard = createServerFn({ method: "POST" }).inputValidator((input) => input).handler(getAdminDashboard_createServerFn_handler, async ({ data }) => {
	const { runAdminDashboard } = await import("./admin.server-BckwV3O6.mjs");
	return runAdminDashboard(data.adminKey);
});
//#endregion
export { getAdminDashboard_createServerFn_handler };
