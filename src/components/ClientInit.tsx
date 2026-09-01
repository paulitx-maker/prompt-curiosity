import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, storageKey: "antijegue-clientinit" } }
);

export function ClientInit() {
  useEffect(() => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }
    console.log("[device_id]", deviceId);

    const ensureUser = async () => {
      const { data } = await supabase.from("users").select("id").eq("device_id", deviceId).maybeSingle();
      if (!data) {
        const { error } = await supabase.from("users").insert({ device_id: deviceId, creditos: 3 });
        if (!error) console.log("[ensureUser] criado");
        else console.log("[ensureUser] erro", error.message);
      } else {
        console.log("[ensureUser] já existe");
      }
    };
    ensureUser();
  }, []);
  return null;
}