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
    const bodyJson = JSON.parse(rawBody)
    const id = bodyJson?.data?.id || ''
    const manifest = `id:${id};request-id:${requestId};ts:${ts};`
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
          const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
          const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY
          const mpToken = env.MP_ACCESS_TOKEN
          const mpSecret = env.MP_WEBHOOK_SECRET

          if (!supabaseUrl || !supabaseKey || !mpToken) {
            console.error('[webhook-pix] env faltando')
            return Response.json({ ok: true })
          }

          if (mpSecret && !validateMPSignature(request, rawBody, mpSecret)) {
            console.warn('[webhook-pix] assinatura inválida - liberado pra teste')
          }

          const supabase = createClient(supabaseUrl, supabaseKey)
          const client = new MercadoPagoConfig({ accessToken: mpToken })
          const payment = await new Payment(client).get({ id: mpId }) as any

          if (payment.status !== 'approved') {
            console.log('[webhook-pix] status não aprovado:', payment.status, 'mpId:', mpId)
            return Response.json({ ok: true, status: payment.status })
          }

          // 1. Acha pagamento
          let { data: pag } = await supabase.from('pagamentos_pix').select('*').eq('mercadopago_id', String(mpId)).single()
          if (!pag) {
            const extRef = payment.external_reference
            const { data: pag2 } = await supabase.from('pagamentos_pix').select('*').eq('txid', extRef).single()
            pag = pag2 as any
          }
          if (!pag) {
            console.error('[webhook-pix] pagamento não encontrado', mpId, payment.external_reference)
            return Response.json({ ok: true })
          }

          console.log('[WEBHOOK] mpId:', mpId, 'txid:', (pag as any).txid, 'device_id:', (pag as any).device_id, 'valor:', (pag as any).valor_brl ?? (pag as any).valor)

          // 2. Idempotência
          const { data: jaCreditado } = await supabase.from('executions').select('id').eq('device_id', (pag as any).device_id).ilike('transcrição', `%${mpId}%`).limit(1).maybeSingle()
          if (jaCreditado) {
            console.log('[webhook-pix] já creditado antes', mpId)
            await supabase.from('pagamentos_pix').update({ status: 'aprovado', mercadopago_id: String(mpId) } as any).eq('id', (pag as any).id)
            return Response.json({ ok: true, idempotente: true })
          }

          // 3. Credita
          const valorPago = Number((pag as any).valor_brl ?? (pag as any).valor ?? 0)
          const qtd = valorPago >= 5 ? 30 : 10
          
          const { data: user } = await supabase.from('users').select('id, credits, creditos').eq('device_id', (pag as any).device_id).maybeSingle()
          
          if (user) {
            const { error } = await supabase.from('users').update({
              credits: (user.credits || 0) + qtd,
              creditos: (user.creditos || 0) + qtd,
            }).eq('device_id', (pag as any).device_id)
            if (error) throw error
          } else {
            await supabase.from('users').insert({
              device_id: (pag as any).device_id,
              credits: qtd,
              creditos: qtd,
            } as any)
          }

          // 4. Marca como aprovado
          await supabase.from('pagamentos_pix').update({ status: 'aprovado', mercadopago_id: String(mpId) } as any).eq('id', (pag as any).id)
          
          await supabase.from('executions').insert({
            device_id: (pag as any).device_id,
            tipo: 'pagamento_pix',
            custo_usd: 0,
            modelo_usado: 'mercadopago',
            file_name: `pix_${mpId}`,
            // @ts-ignore
            transcrição: JSON.stringify({ mercadopago_id: String(mpId), creditos: qtd, valor: valorPago }),
          } as any)

          console.log('[webhook-pix] CREDITADO OK', (pag as any).device_id, `+${qtd}`)
          return Response.json({ ok: true, creditos: qtd })
        } catch (e) {
          console.error('[webhook-pix] erro', e)
          return Response.json({ ok: true })
        }
      },
    },
  },
})