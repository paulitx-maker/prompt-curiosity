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
      if (credits !== null && user.credits < credits) {
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

  if (credits === null) return <div className="h-8 w-24 bg-zinc-100 rounded-full animate-pulse" />

  const quaseFim = usosHoje >= 8

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${animating ? 'scale-110 bg-red-50 border-red-200' : 'bg-white border-zinc-200'} ${quaseFim ? 'border-orange-300' : ''}`}>
      <span className={animating ? 'text-red-600' : ''}>⚡ {credits} créditos</span>
      <span className="text-[11px] text-zinc-500 border-l pl-2">
        {usosHoje}/{LIMITE} hoje
      </span>
    </div>
  )
}