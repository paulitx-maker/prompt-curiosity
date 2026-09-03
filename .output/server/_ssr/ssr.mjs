//#region node_modules/.nitro/vite/services/ssr/index.js
var server_default = { async fetch(request, env, ctx) {
	const mod = await import("./server-DfCXB3Hu.mjs");
	return (mod.default ?? mod).fetch(request, env, ctx);
} };
//#endregion
export { server_default as default };
