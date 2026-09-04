import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_PACK_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl ||!supabaseKey) {
  console.error("[ClientInit] ENV faltando", {
    url:!!supabaseUrl,
    hasKey:!!supabaseKey,
    envs: Object.keys(import.meta.env).filter(k => k.includes('SUPABASE'))
  });
}

const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: { persistSession: false, autoRefreshToken: false, storageKey: "antijegue-clientinit" }
});

export function ClientInit() {
  useEffect(() => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }

    const ensureUser = async () => {
      try {
        const { data, error: selErr } = await supabase
         .from("users")
         .select("device_id, credits")
         .eq("device_id", deviceId)
         .maybeSingle();

        if (selErr) {
          console.warn("[ensureUser] select err", selErr.message);
          return;
        }

        if (!data) {
          // Só cria se não existe - NUNCA reseta
          const { error: insErr } = await supabase
           .from("users")
           .insert({ device_id: deviceId, credits: 3 } as any);

          if (!insErr) {
            console.log("[ensureUser] criado com 3 créditos");
            window.dispatchEvent(new Event("credits-updated"));
          } else {
            console.error("[ensureUser] insert err", insErr.message);
          }
        } else {
          console.log("[ensureUser] já existe", data);
        }
      } catch (e: any) {
        console.error("[ensureUser] exception", e.message);
      }
    };

    ensureUser();
  }, []);

  return null;
}