import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import crypto from 'crypto'

function validateMPSignature(req: Request, rawBody: string, secret: string): boolean {
  try {
    const signature = req.headers.get('x-signature')
    const requestId = req.headers.get('x-request-id')
    if (!signature || !requestId || !secret) return false
    const parts = Object.fromEntries(signature.split(',').map(p => p.split('=') as [string, string]))
    const ts = parts['ts']
    const hash = parts['v1']
    if (!ts || !hash) return false
    const idMatch = rawBody.match(/"id"\s*:\s*"?(\d+)"?/)
    const manifest = `id:${idMatch?.[1] || ''};request-id:${requestId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
    return hmac === hash
  } catch { return false }
}

export const Route = createFileRoute('/api/webhook-pix')({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const rawBody = await request.clone().text()
        try {
          const body = JSON.parse(rawBody)
          const mpId = body?.data?.id
          if (!mpId) return Response.json({ ok: true })

          const env = process.env as any
          const supabaseUrl = env['SUPABASE_URL']
          const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']
          const mpToken = env['MP_ACCESS_TOKEN']
          const mpSecret = env['MP_WEBHOOK_SECRET']

          if (!supabaseUrl || !supabaseKey || !mpToken) return Response.json({ ok: true })

          if (mpSecret && !validateMPSignature(request, rawBody, mpSecret)) {
            console.warn('[webhook-pix] assinatura inválida')
            // return new Response('forbidden', { status: 403 }) // ativa depois do teste
          }

          const supabase = createClient(supabaseUrl, supabaseKey)
          const client = new MercadoPagoConfig({ accessToken: mpToken })
          const payment = await new Payment(client).get({ id: mpId }) as any

          if (payment.status !== 'approved') {
            return Response.json({ ok: true, status: payment.status })
          }

          const { data: pag } = await supabase.from('pagamentos_pix').select('*').eq('mercadopago_id', String(mpId)).single()
          if (!pag) {
            // tenta por external_reference
            const extRef = payment.external_reference
            const { data: pag2 } = await supabase.from('pagamentos_pix').select('*').eq('txid', extRef).single()
            if (!pag2) return Response.json({ ok: true, error: 'pag nao encontrado' })
            // atualiza
            await supabase.from('pagamentos_pix').update({ mercadopago_id: String(mpId), status: 'aprovado' } as any).eq('txid', extRef)
            await supabase.rpc('increment_credits', { d_id: (pag2 as any).device_id, qtd: 10 } as any)
            return Response.json({ ok: true, creditos: 10 })
          }

          if ((pag as any).status === 'aprovado') {
            return Response.json({ ok: true, idempotente: true })
          }

          await supabase.from('pagamentos_pix').update({ status: 'aprovado' } as any).eq('mercadopago_id', String(mpId))
          await supabase.rpc('increment_credits', { d_id: (pag as any).device_id, qtd: 10 } as any)
          await supabase.from('executions').insert({
            device_id: (pag as any).device_id,
            tipo: 'pagamento_pix',
            custo_creditos: 0,
            input_json: { mercadopago_id: mpId, creditos: 10 },
          } as any)

          return Response.json({ ok: true, creditos: 10 })
        } catch (e) {
          console.error('[webhook-pix] erro', e)
          return Response.json({ ok: true })
        }
      },
    },
  },
})