import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

type Props = { deviceId: string }

export function CreditsBadge({ deviceId }: Props) {
  const [credits, setCredits] = useState<number | null>(null)
  const [usosHoje, setUsosHoje] = useState(0)
  const [animating, setAnimating] = useState(false)
  const LIMITE = 10

  async function load() {
    const { data: user } = await supabase
     .from('users')
     .select('credits')
     .eq('device_id', deviceId)
     .single()

    if (user) {
      if (credits!== null && user.credits < credits) {
        setAnimating(true)
        setTimeout(() => setAnimating(false), 600)
      }
      setCredits(user.credits)
    }

    const hoje = new Date().toISOString().slice(0,10)
    const { count } = await supabase
     .from('executions')
     .select('*', { count: 'exact', head: true })
     .eq('device_id', deviceId)
     .gte('created_at', `${hoje}T00:00:00`)

    setUsosHoje(count || 0)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000)
    window.addEventListener('credits-updated', load)
    return () => {
      clearInterval(interval)
      window.removeEventListener('credits-updated', load)
    }
  }, [deviceId])

  if (credits === null) return <div className="h-8 w-32 bg-[#1A1A23] rounded-full animate-pulse border border-white/5" />

  const quaseFim = usosHoje >= 8

  return (
    <div className={`
      flex items-center gap-2.5 px-4 py-1.5 rounded-full
      bg-[#12121A]/90 backdrop-blur-md border text-[13px] font-medium
      transition-all duration-300
      ${animating? 'scale-105 border-red-400/50 shadow-[0_0_15px_rgba(248,113,113,0.3)]' : 'border-white/10 hover:border-[#00E5FF]/30'}
      ${quaseFim &&!animating? 'border-orange-400/30 shadow-[0_0_12px_rgba(251,146,60,0.15)]' : ''}
    `}>
      <span className={`tracking-wide ${animating? 'text-red-300' : 'text-[#00E5FF]'}`}>
        ⚡ {credits}
      </span>
      <span className="text-zinc-200">
        créditos
      </span>
      <span className="text-[11px] text-zinc-400 border-l border-white/10 pl-2.5 ml-0.5 font-normal">
        {usosHoje}/{LIMITE} hoje
      </span>
    </div>
  )
}