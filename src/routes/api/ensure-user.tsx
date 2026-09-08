import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/api/ensure-user')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { device_id } = await request.json().catch(()=>({})) as any
        if(!device_id) return Response.json({error:'missing'},{status:400})
        const env = process.env as any
        const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
        const key = env.SUPABASE_SERVICE_ROLE_KEY
        const admin = createClient(url, key, { auth: { persistSession: false } })

        // upsert seguro: não reseta credits pra 3 se já existe
        let { data } = await admin.from('users').select('*').eq('device_id', device_id).single()
        if(!data){
          const ins = await admin.from('users').insert({ device_id, credits: 3 }).select().single()
          if(ins.error) return Response.json({error:ins.error.message},{status:500})
          data = ins.data
        }

        // contador vem do server, client nunca mais conta direto
        const hoje = new Date().toISOString().slice(0,10)
        const { count } = await admin.from("executions")
          .select("*", { count: "exact", head: true })
          .eq("device_id", device_id)
          .gte("created_at", `${hoje}T00:00:00`)

        return Response.json({ ...data, usadoHoje: count ?? 0 })
      }
    }
  }
})