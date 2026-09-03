import { Link, useRouterState } from '@tanstack/react-router'

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isHome = pathname === '/' || pathname.startsWith('/antijegue')
  const isPack = pathname.startsWith('/pack')

  return (
    <>
      <div className="h-[72px] md:hidden" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A0F]/90 backdrop-blur-md border-t border-white/10">
        <div className="flex justify-around items-center h-[68px] max-w-md mx-auto px-6">

          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${isHome? 'text-[#00E5FF]' : 'text-zinc-500'}`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${isHome? 'bg-[#00E5FF]/15 shadow-[0_0_12px_rgba(0,229,255,0.3)] animate-[pisca_0.6s_ease-in-out]' : ''}`}>
              <span className="text-[20px]">⚡</span>
            </div>
            <span className="text-[11px] font-medium tracking-wide">Criar</span>
          </Link>

          <Link
            to="/pack"
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${isPack? 'text-[#00E5FF]' : 'text-zinc-500'}`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${isPack? 'bg-[#00E5FF]/15 shadow-[0_0_12px_rgba(0,229,255,0.3)] animate-[pisca_0.6s_ease-in-out]' : ''}`}>
              <span className="text-[20px]">📚</span>
            </div>
            <span className="text-[11px] font-medium tracking-wide">Biblioteca</span>
          </Link>

        </div>
      </nav>

      <style>{`
        @keyframes pisca {
          0% { opacity: 0.4; filter: drop-shadow(0 0 2px rgba(0,229,255,0.1)); }
          50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(0,229,255,0.4)); }
          100% { opacity: 1; filter: drop-shadow(0 0 6px rgba(0,229,255,0.2)); }
        }
      `}</style>
    </>
  )
}