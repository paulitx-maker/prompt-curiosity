import { useEffect, useState } from 'react'

type Props = { credits: number, usadoHoje: number }

export function CreditsBadge({ credits, usadoHoje }: Props) {
  const [animating, setAnimating] = useState(false)
  const [prevCredits, setPrevCredits] = useState(credits)
  const LIMITE = 10

  useEffect(() => {
    if (credits < prevCredits) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 600)
    }
    setPrevCredits(credits)
  }, [credits, prevCredits])

  const quaseFim = usadoHoje >= 8

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
      <span className="text-zinc-200">créditos</span>
      <span className="text-[11px] text-zinc-400 border-l border-white/10 pl-2.5 ml-0.5 font-normal">
        {usadoHoje}/{LIMITE} hoje
      </span>
    </div>
  )
}