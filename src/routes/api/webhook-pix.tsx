import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/api/webhook-pix')({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const body = await request.json()
        const mpId = body?.data?.id
        if (!mpId) return Response.json({ ok: true })
        const supabase = createClient(process.env['VITE_SUPABASE_URL'] as string, process.env['VITE_SUPABASE_ANON_KEY'] as string)
        const { data: pag } = await supabase.from('pagamentos_pix').select('*').eq('mercadopago_id', String(mpId)).single()
        if (!pag || (pag as any).status === 'aprovado') return Response.json({ ok: true })
        await supabase.from('pagamentos_pix').update({ status: 'aprovado' }).eq('txid', (pag as any).txid)
        await supabase.rpc('increment_credits', { d_id: (pag as any).device_id, qtd: 10 })
        return Response.json({ ok: true })
      }
    }
  }
})