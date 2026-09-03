import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/antijegue.functions-ecTPsoVb.js
var postImagem_createServerFn_handler = createServerRpc({
	id: "816638c986f2c6721146cdfeee04c9b8718c79d14f538d8aae3cc79bff1094b1",
	name: "postImagem",
	filename: "src/lib/antijegue.functions.ts"
}, (opts) => postImagem.__executeServer(opts));
var postImagem = createServerFn({ method: "POST" }).validator((input) => input).handler(postImagem_createServerFn_handler, async ({ data }) => {
	const { runPostImagem } = await import("./antijegue.server-DDC-a3BX.mjs");
	return runPostImagem(data);
});
var audioResumo_createServerFn_handler = createServerRpc({
	id: "65c4eb2d8b28ef037702a89e0b5d3ff1f9603aa950a6103f64067c7264a66cb3",
	name: "audioResumo",
	filename: "src/lib/antijegue.functions.ts"
}, (opts) => audioResumo.__executeServer(opts));
var audioResumo = createServerFn({ method: "POST" }).validator((input) => input).handler(audioResumo_createServerFn_handler, async ({ data }) => {
	const { runAudioResumo } = await import("./antijegue.server-DDC-a3BX.mjs");
	return runAudioResumo(data);
});
var enviarFeedback_createServerFn_handler = createServerRpc({
	id: "3a91425a94bddd14612a94d757e8a42705d21fff6414a6a2dc2de4f0c6102615",
	name: "enviarFeedback",
	filename: "src/lib/antijegue.functions.ts"
}, (opts) => enviarFeedback.__executeServer(opts));
var enviarFeedback = createServerFn({ method: "POST" }).validator((input) => input).handler(enviarFeedback_createServerFn_handler, async ({ data }) => {
	const { runEnviarFeedback } = await import("./antijegue.server-DDC-a3BX.mjs");
	return runEnviarFeedback(data);
});
//#endregion
export { audioResumo_createServerFn_handler, enviarFeedback_createServerFn_handler, postImagem_createServerFn_handler };
