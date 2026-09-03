//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-OpYrR1zz.js
var manifest = {
	"3a91425a94bddd14612a94d757e8a42705d21fff6414a6a2dc2de4f0c6102615": {
		functionName: "enviarFeedback_createServerFn_handler",
		importer: () => import("./_ssr/antijegue.functions-ecTPsoVb.mjs")
	},
	"65c4eb2d8b28ef037702a89e0b5d3ff1f9603aa950a6103f64067c7264a66cb3": {
		functionName: "audioResumo_createServerFn_handler",
		importer: () => import("./_ssr/antijegue.functions-ecTPsoVb.mjs")
	},
	"816638c986f2c6721146cdfeee04c9b8718c79d14f538d8aae3cc79bff1094b1": {
		functionName: "postImagem_createServerFn_handler",
		importer: () => import("./_ssr/antijegue.functions-ecTPsoVb.mjs")
	},
	"bd91712aa12a864ae43341e860d6d1c64b91b59ae5ce60ea0dbdc10eee9819c1": {
		functionName: "getAdminDashboard_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-aR4DZP5b.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
