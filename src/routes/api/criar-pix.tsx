import { createFileRoute } from '@tanstack/react-router'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/api/criar-pix')({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const body = await request.json()
        const supabase = createClient(
          process.env['VITE_SUPABASE_URL'] as string,
          process.env['VITE_SUPABASE_ANON_KEY'] as string
        )
        const { data: preco } = await supabase.from('precos').select('*').eq('creditos', body.creditos).single()
        if (!preco) return Response.json({ error: 'preco nao encontrado' }, { status: 400 })
        const txid = `pix_${body.device_id}_${Date.now()}`
        await supabase.from('pagamentos_pix').insert({ device_id: body.device_id, valor_brl: (preco as any).valor_brl, txid, status: 'pendente' })
        const client = new MercadoPagoConfig({ accessToken: process.env['MP_ACCESS_TOKEN'] as string })
        const mp = await new Payment(client).create({ body: { transaction_amount: (preco as any).valor_brl, payment_method_id: 'pix', external_reference: body.device_id, description: `${body.creditos} creditos`, payer: { email: `${body.device_id}@aprendendo.app` } } } as any)
        await supabase.from('pagamentos_pix').update({ mercadopago_id: String((mp as any).id) }).eq('txid', txid)
        return Response.json({ txid, qr_code: (mp as any).point_of_interaction?.transaction_data?.qr_code, qr_code_base64: (mp as any).point_of_interaction?.transaction_data?.qr_code_base64 })
      }
    }
  }
})