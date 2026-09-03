import { r as __toESM } from "../_runtime.mjs";
import { c as HeadContent, d as Outlet, f as lazyRouteComponent, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime, r as require_react, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CCOKNySJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var supabase = createClient("https://c--82546c09-26c0-4014-805c-18bee6fe3f55-prod.lovable.cloud", "sb_publishable_s7hPFb6qivT14xkV5B5yHA_IgwhbY_h", { auth: {
	persistSession: false,
	autoRefreshToken: false,
	storageKey: "antijegue-clientinit"
} });
function ClientInit() {
	(0, import_react.useEffect)(() => {
		let deviceId = localStorage.getItem("device_id");
		if (!deviceId) {
			deviceId = crypto.randomUUID();
			localStorage.setItem("device_id", deviceId);
		}
		console.log("[device_id]", deviceId);
		const ensureUser = async () => {
			const { data } = await supabase.from("users").select("id").eq("device_id", deviceId).maybeSingle();
			if (!data) {
				const { error } = await supabase.from("users").insert({
					device_id: deviceId,
					creditos: 3
				});
				if (!error) console.log("[ensureUser] criado");
				else console.log("[ensureUser] erro", error.message);
			} else console.log("[ensureUser] já existe");
		};
		ensureUser();
	}, []);
	return null;
}
var styles_default = "/assets/styles-OKsFs0TM.css";
var Route$4 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Anti-Jegue" }
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-background text-foreground antialiased",
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
function RootComponent() {
	const { queryClient } = Route$4.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientInit, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})
		]
	});
}
var $$splitComponentImporter$3 = () => import("./routes-C2lugtuy.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./admin-a9-wvoTR.mjs");
var Route$2 = createFileRoute("/admin")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "Backoffice — Anti-Jegue" },
		{
			name: "description",
			content: "Painel interno do Anti-Jegue: execuções, dispositivos, custo em dólar e feedbacks negativos."
		},
		{
			property: "og:title",
			content: "Backoffice — Anti-Jegue"
		},
		{
			property: "og:description",
			content: "Painel interno de uso e custo das execuções do Anti-Jegue."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		},
		{
			name: "robots",
			content: "noindex, nofollow"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./pack-B8d6gkTN.mjs");
var Route$1 = createFileRoute("/pack")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./test-CHeRjPcg.mjs");
var Route = createFileRoute("/test")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	AdminRoute: Route$2.update({
		id: "/admin",
		path: "/admin",
		getParentRoute: () => Route$4
	}),
	PackRoute: Route$1.update({
		id: "/pack",
		path: "/pack",
		getParentRoute: () => Route$4
	}),
	TestRoute: Route.update({
		id: "/test",
		path: "/test",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true
	});
};
//#endregion
export { getRouter };
