export function PaywallBottomSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end">
      <div className="w-full bg-[#12121A] border-t border-white/10 rounded-t-[24px] p-6">
        <h3 className="text-white font-bold text-lg">Sem créditos</h3>
        <p className="text-zinc-400 text-sm mt-1">Você usou seus 3 testes grátis.</p>
        <button
          onClick={async () => {
            const res = await fetch('/api/criar-pix', { method: 'POST', body: JSON.stringify({ valor: 1.99 }) })
            const { qr_code } = await res.json()
            // abre seu QR
          }}
          className="w-full mt-4 h-12 bg-[#00E5FF] text-black font-bold rounded-xl"
        >
          Comprar 10 créditos - R$1,99
        </button>
        <button onClick={onClose} className="w-full mt-3 text-zinc-500 text-sm">Fechar</button>
      </div>
    </div>
  )
}