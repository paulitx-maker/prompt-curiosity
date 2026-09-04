import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function validarAssinaturaMP(
  xSig: string | null,
  xReqId: string | null,
  dataId: string | null,
  secret: string
): boolean {
  if (!secret) return true // se não configurou, não bloqueia mas loga
  if (!xSig || !xReqId || !dataId) return false
  try {
    const parts = Object.fromEntries(
      xSig.split(',').map((p) => p.trim().split('='))
    ) as Record<string, string>
    const ts = parts['ts']
    const v1 = parts['v1']
    if (!ts || !v1) return false
    const manifest = `id:${dataId.toLowerCase()};request-id:${xReqId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
    if (hmac.length !== v1.length) return false
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
  } catch {
    return false
  }
}

export const Route = createFileRoute('/api/webhook-pix')({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const rawBody = await request.clone().text()
        const url = new URL(request.url)

        // MP manda 2 formatos: ?data.id= + ?id= + body {data:{id}}
        const dataId =
          url.searchParams.get('data.id') ||
          url.searchParams.get('id') ||
          (() => {
            try {
              return JSON.parse(rawBody)?.data?.id
            } catch {
              return null
            }
          })()

        if (!dataId) {
          console.log('[WEBHOOK-PIX] sem dataId - ignorado')
          return Response.json({ ok: true, ignored: 'no_id' })
        }

        const env = process.env as any
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
        const mpSecret = env.MP_WEBHOOK_SECRET
        const mpToken = env.MP_ACCESS_TOKEN_APP || env.MP_ACCESS_TOKEN

        if (!mpToken) {
          console.error('[WEBHOOK-PIX] MP_ACCESS_TOKEN ausente')
          return Response.json({ ok: true }) // retorna 200 pra não ficar em retry infinito
        }

        // Validação de assinatura - LOGA mas não bloqueia se for inválida pra não perder crédito real
        const sigValid = validarAssinaturaMP(
          request.headers.get('x-signature'),
          request.headers.get('x-request-id'),
          String(dataId),
          mpSecret
        )
        if (!sigValid) {
          console.warn(
            `[WEBHOOK-PIX][${dataId}] assinatura_invalida - x-signature=${request.headers.get('x-signature')} - verificar MP_WEBHOOK_SECRET`
          )
        }

        try {
          // FONTE DA VERDADE: busca na API do MP, não confia no body
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
            headers: { Authorization: `Bearer ${mpToken}` },
          })

          if (!mpRes.ok) {
            console.error(`[WEBHOOK-PIX][${dataId}] falha ao buscar MP ${mpRes.status}`)
            // 404 no MP pode ser pagamento ainda propagando, retorna 200 pra parar retry agressivo
            if (mpRes.status === 404) return Response.json({ ok: true, mp: 'not_found_yet' })
            return Response.json({ ok: true }) // não dá 500 pra não cair em loop do MP
          }

          const payment = await mpRes.json()
          const extRef = payment.external_reference as string | null

          console.log(
            `[WEBHOOK-PIX][${dataId}] recebido status=${payment.status} extRef=${extRef} valor=${payment.transaction_amount}`
          )

          // 1) RASTREIO: marca WEBHOOK_RECEBIDO COM GUARDA - NUNCA regride CREDITADO
          // Ponto 2 do Claude
          if (extRef || dataId) {
            // tenta por mercadopago_id primeiro (chave estável)
            let updated = await supabase
              .from('pagamentos_pix')
              .update({
                fase: 'WEBHOOK_RECEBIDO',
                mp_status: payment.status,
                raw_webhook: payment,
                updated_at: new Date().toISOString(),
              } as any)
              .eq('mercadopago_id', String(dataId))
              .neq('fase', 'CREDITADO')
              .select('id')

            // fallback por txid se não achou por mercadopago_id
            if ((!updated.data || updated.data.length === 0) && extRef) {
              await supabase
                .from('pagamentos_pix')
                .update({
                  fase: 'WEBHOOK_RECEBIDO',
                  mp_status: payment.status,
                  raw_webhook: payment,
                  updated_at: new Date().toISOString(),
                } as any)
                .eq('txid', extRef)
                .neq('fase', 'CREDITADO')
            }
          }

          // 2) Só credita se for approved
          if (payment.status !== 'approved') {
            return Response.json({ ok: true, status: payment.status, await: 'approved' })
          }

          // 3) CRÉDITO ATÔMICO - proteção contra race condition dos 2 webhooks (v1 + v2)
          // RPC faz UPDATE ... WHERE fase NOT IN ('CREDITADO','CREDITANDO') com lock de linha
          const { data, error } = await supabase.rpc('creditar_pagamento_pix', {
            p_mercadopago_id: String(dataId),
            p_mp_status: payment.status,
            p_raw_webhook: payment,
          } as any)

          if (error) {
            console.error(`[WEBHOOK-PIX][${dataId}] falha_rpc ${error.message} - fallback seguro`)

            // FALLBACK SEGURO - também com guarda, nunca duplica
            const { data: pag } =
              (await supabase
                .from('pagamentos_pix')
                .select('*')
                .eq('mercadopago_id', String(dataId))
                .maybeSingle()) ||
              ({ data: null } as any)

            const pag2 = pag
              ? pag
              : extRef
                ? (
                    await supabase.from('pagamentos_pix').select('*').eq('txid', extRef).maybeSingle()
                  ).data
                : null

            if (pag2 && (pag2 as any).fase !== 'CREDITADO') {
              const qtd =
                Number((pag2 as any).qtd_creditos) ||
                (Number((pag2 as any).valor_brl) >= 5 ? 30 : 10)

              // Lock otimista: só atualiza se ainda não foi creditado
              const { data: updated } = await supabase
                .from('pagamentos_pix')
                .update({
                  fase: 'CREDITADO',
                  status: 'aprovado',
                  mp_status: 'approved',
                  credited_at: new Date().toISOString(),
                  raw_webhook: payment,
                } as any)
                .eq('id', (pag2 as any).id)
                .neq('fase', 'CREDITADO')
                .select()

              if (updated && updated.length > 0) {
                const { data: user } = await supabase
                  .from('users')
                  .select('credits,creditos')
                  .eq('device_id', (pag2 as any).device_id)
                  .maybeSingle()

                if (user) {
                  await supabase
                    .from('users')
                    .update({
                      credits: (user.credits || 0) + qtd,
                      creditos: (user.creditos || 0) + qtd,
                    })
                    .eq('device_id', (pag2 as any).device_id)
                } else {
                  await supabase
                    .from('users')
                    .insert({ device_id: (pag2 as any).device_id, credits: qtd, creditos: qtd } as any)
                }
                console.log(`[WEBHOOK-PIX][${dataId}] CREDITADO fallback +${qtd} ${(pag2 as any).device_id}`)
                return Response.json({ ok: true, fallback: true, creditos: qtd })
              } else {
                console.log(`[WEBHOOK-PIX][${dataId}] fallback ja CREDITADO por outra thread`)
                return Response.json({ ok: true, ja_processado: true })
              }
            }
            return Response.json({ ok: true, rpc_error: error.message })
          }

          const res = (data as any)?.[0]
          console.log(
            `[WEBHOOK-PIX][${dataId}] resultado sucesso=${res?.sucesso} ja=${res?.ja_processado} corr=${res?.correlation_id}`
          )
          return Response.json({ ok: true, ...res })
        } catch (e: any) {
          console.error('[WEBHOOK-PIX] erro interno', e?.message || e)
          // SEMPRE 200 pro MP, senão ele entra em retry agressivo e pode duplicar carga
          return Response.json({ ok: true, erro_interno: true })
        }
      },
    },
  },
})