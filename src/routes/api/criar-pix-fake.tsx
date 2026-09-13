import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const TABELA_PRECOS: Record<string, { valor_brl: number, qtd: number }> = {
  '10': { valor_brl: 1.99, qtd: 10 },
  '30': { valor_brl: 4.99, qtd: 30 },
  'pack_10': { valor_brl: 1.99, qtd: 10 },
  'pack_30': { valor_brl: 4.99, qtd: 30 },
}

export const Route = createFileRoute('/api/criar-pix-fake')({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const correlation_id = crypto.randomUUID()
        try {
          const body = await request.json().catch(()=>({}))
          const { device_id, pack_id } = body
          if (!device_id) return Response.json({ error: 'device_id obrigatório', correlation_id }, { status: 400 })

          const env = process.env as any
          const enabled = env.FAKE_PIX_ENABLED === 'true' || env.FAKE_PIX_ENABLED === true
          const secretHeader = request.headers.get('x-fake-pix-secret')
          const secretEnv = env.FAKE_PIX_SECRET || 'dev_fake_secret_77fcd1f'
          if (!enabled && secretHeader !== secretEnv) {
            return Response.json({ error: 'FAKE_PIX_DISABLED', correlation_id, hint: 'Set FAKE_PIX_ENABLED=true ou envie header X-FAKE-PIX-SECRET' }, { status: 403 })
          }

          const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
          const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY
          if (!supabaseUrl || !serviceKey) return Response.json({ error: 'env_missing supabase', correlation_id }, { status: 500 })
          const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

          let pack = (TABELA_PRECOS[pack_id] || TABELA_PRECOS['10']) as any
          try {
            const { data: pkg } = await supabase.from('pacotes_credito').select('*').eq('id', pack_id).eq('ativo', true).maybeSingle() as any
            if (pkg) {
              pack = { valor_brl: (pkg as any).preco_centavos ? (pkg as any).preco_centavos/100 : (pkg as any).valor_brl || (pkg as any).preco, qtd: (pkg as any).qtd_creditos || (pkg as any).qtd }
            }
          } catch {}

          const { valor_brl, qtd } = pack

          const { data: user, error: userErr } = await supabase.from('users').select('*').eq('device_id', device_id).maybeSingle() as any
          if (userErr) console.warn('[FAKE-PIX] user select', userErr.message)
          const currentCredits = user?.credits ?? user?.creditos ?? 0
          if ((currentCredits + qtd) > 400) {
            return Response.json({ error: 'MAX_400', credits: currentCredits, max: 400, correlation_id }, { status: 400 })
          }

          const txid = `fake_pix_${device_id.slice(0,8)}_${Date.now()}_${correlation_id.slice(0,8)}`

          // CORREÇÃO chk_fase: usa fase permitida 'CRIADO' (ou 'APROVADO' se existir) em vez de 'FAKE_APROVADO' que violava constraint
          // fake=true fica no raw_mp_response para rastreabilidade
          const { error: insErr } = await supabase.from('pagamentos_pix').insert({
            correlation_id,
            device_id,
            txid,
            valor_brl,
            pack_id: pack_id || '10',
            qtd_creditos: qtd,
            status: 'aprovado', // status real aprovado
            fase: 'CRIADO', // fase permitida pelo chk_fase (mesmo que criar-pix.tsx usa)
            mercadopago_id: `fake_${correlation_id}`,
            raw_mp_response: { fake: true, fase_original: 'FAKE_APROVADO', correlation_id, pack_id, qtd, valor_brl, created_at: new Date().toISOString() },
            updated_at: new Date().toISOString()
          } as any)
          if (insErr) throw insErr

          const novoSaldo = currentCredits + qtd
          const { error: updErr } = await supabase.from('users').update({
            credits: novoSaldo,
            creditos: novoSaldo,
            updated_at: new Date().toISOString()
          } as any).eq('device_id', device_id)
          if (updErr) throw updErr

          console.log(`[FAKE-PIX][${correlation_id}][${device_id}] fase=FAKE_APROVADO(real=CRIADO) pack=${pack_id} ${currentCredits}->${novoSaldo}`)

          return Response.json({
            id: `fake_${correlation_id}`,
            txid,
            correlation_id,
            valor_brl,
            qtd_creditos: qtd,
            credits: novoSaldo,
            creditos: novoSaldo,
            status: 'aprovado',
            fase: 'FAKE_APROVADO', // retorna fake para frontend, mas no banco gravou CRIADO permitido
            fase_real_banco: 'CRIADO',
            fake: true,
            message: `${currentCredits}->${novoSaldo}`
          })
        } catch (e: any) {
          console.error(`[FAKE-PIX][${(e as any).correlation_id || 'unknown'}] FALHA`, e.message)
          return Response.json({ error: e.message, fake: true }, { status: 500 })
        }
      },
    },
  },
})