import { useEffect } from "react";
import { getDeviceId } from "@/lib/device";

/** Garante que o device_id exista no localStorage logo no primeiro carregamento. */
export default function ClientInit() {
  useEffect(() => {
    getDeviceId();
  }, []);
  return null;
}
