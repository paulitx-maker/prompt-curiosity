import { createFileRoute } from '@tanstack/react-router'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/api/criar-pix')({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json()
          const { device_id, pack_id, preco } = body
          if (!device_id) return Response.json({ error: 'device_id obrigatório' }, { status: 400 })

          const env = process.env as any
          const supabaseUrl = env['SUPABASE_URL'] || env['VITE_SUPABASE_URL']
          const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']
          const mpToken = env['MP_ACCESS_TOKEN']

          if (!mpToken?.startsWith('APP_USR-')) {
            console.error('[criar-pix] TOKEN NÃO É DE PROD:', mpToken?.slice(0, 15))
            return Response.json({ error: 'Token MP não é produção' }, { status: 500 })
          }

          const supabase = createClient(supabaseUrl, supabaseKey)
          const txid = `pix_${device_id.slice(0, 8)}_${Date.now()}`
          const valor = Number(preco || 1.99)

          await supabase.from('pagamentos_pix').insert({
            device_id,
            txid,
            valor,
            mercadopago_id: null,
            pack_id: pack_id || null,
            status: 'pendente',
          } as any)

          const client = new MercadoPagoConfig({ accessToken: mpToken })
          const payment = new Payment(client)

          // corrige VERCEL_URL - pega do env correto
          const vercelUrl = env['VERCEL_URL'] || env['VERCEL_PROJECT_PRODUCTION_URL'] || 'prompt-curiosity.vercel.app'
          const baseUrl = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`

          const result = await payment.create({
            body: {
              transaction_amount: valor,
              description: 'Anti-Jegue - Creditos',
              payment_method_id: 'pix',
              payer: { email: `${device_id}@antijegue.com` },
              external_reference: txid,
              notification_url: `${baseUrl}/api/webhook-pix`,
            },
          } as any)

          // salva o id do MP pra webhook achar depois
          await supabase.from('pagamentos_pix').update({ mercadopago_id: String((result as any).id) }).eq('txid', txid)

          const pixData = (result as any).point_of_interaction?.transaction_data

          return Response.json({
            id: result.id,
            txid,
            qr_code: pixData?.qr_code,
            qr_code_base64: pixData?.qr_code_base64,
            valor,
          })
        } catch (e: any) {
          console.error('[criar-pix] erro', e)
          return Response.json({ error: e.message }, { status: 500 })
        }
      },
    },
  },
})