import { useState, useEffect } from "react"

export function PaywallBottomSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pix, setPix] = useState<{ qr_code_base64?: string; qr_code?: string } | null>(null)
  const [showPix, setShowPix] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("abrir-paywall", handler)
    return () => window.removeEventListener("abrir-paywall", handler)
  }, [])

  async function handleClick() {
    if (pix) {
      setShowPix(true)
      return
    }
    setLoading(true)
    try {
      const device_id = localStorage.getItem("device_id") || ""
      const res = await fetch("/api/criar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id, preco: 1.99, pack_id: "10-creditos" })
      })
      const data = await res.json()
      if (data.qr_code || data.qr_code_base64) {
        setPix(data)
        setShowPix(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* BARRINHA BRANCA IGUAL DO SEU PRINT */}
      <div
        onClick={handleClick}
        className="fixed bottom-[72px] left-3 right-3 z-[90] flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-2xl animate-in slide-in-from-bottom"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[12px] text-white">!</span>
        <p className="flex-1 text-[13px] font-medium text-black">
          {loading? "Gerando PIX..." : "Sem créditos. Desbloqueie por R$1,99"}
        </p>
        <span className="text-[11px] font-bold text-cyan-600">{pix? "Ver QR" : ""}</span>
      </div>

      {/* MODAL DO QR SÓ ABRE QUANDO CLICA NA BARRINHA */}
      {showPix && pix && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60" onClick={() => setShowPix(false)}>
          <div className="w-full max-w-md rounded-t-[24px] bg-[#12121A] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white">Pague com PIX</h3>
            {pix.qr_code_base64 && (
              <img src={`data:image/png;base64,${pix.qr_code_base64}`} className="mx-auto mt-4 w-64 rounded-xl bg-white p-2" />
            )}
            <button onClick={() => navigator.clipboard.writeText(pix.qr_code || "")} className="mt-4 w-full rounded-xl bg-[#00E5FF] py-3 font-bold text-black">
              Copiar código PIX
            </button>
            <button onClick={() => { setShowPix(false); setOpen(false) }} className="mt-3 w-full text-sm text-zinc-500">Fechar</button>
          </div>
        </div>
      )}
    </>
  )
}