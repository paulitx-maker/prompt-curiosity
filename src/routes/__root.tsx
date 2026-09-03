import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ClientInit } from "@/components/ClientInit";
import { CreditsBadge } from "@/components/CreditsBadge";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Anti-Jegue" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body className="bg-background text-foreground antialiased">{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    setDeviceId(localStorage.getItem("device_id") || "");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ClientInit />
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-3 border-b bg-white/80 backdrop-blur">
        <span className="font-black tracking-tight">ANTI-JEGUE</span>
        {deviceId && <CreditsBadge deviceId={deviceId} />}
      </header>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}