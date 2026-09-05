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
        const { data, error } = await admin.from('users').upsert({ device_id, credits: 3 }, { onConflict: 'device_id' }).select().single()
        if(error) return Response.json({error:error.message},{status:500})
        return Response.json(data)
      }
    }
  }
})