import { supabase } from '@/integrations/supabase/client'
import { getDeviceId } from '@/lib/device'
import { useTracking } from './use-tracking'

export function useCredits() {
  const { track } = useTracking()

  const consume = async (tipo: 'consumo_copia' | 'consumo_geracao', pack_id: string, prompt_id?: string) => {
    const device_id = getDeviceId()
    if(!device_id) throw new Error('sem device_id')

    // 1 crédito por uso - igual ao pack.tsx
    const { data: novoSaldo, error } = await supabase.rpc('charge_credit', { 
      _device_id: device_id, 
      _custo: 1
    } as any)

    if(error) throw error
    if(novoSaldo === null || novoSaldo < 0) throw new Error('SEM_CREDITO')

    await supabase.from('credit_transactions').insert({
      device_id,
      tipo,
      pack_id,
      prompt_id: prompt_id || null,
      qtd: -1,
      saldo_depois: novoSaldo
    } as any)

    track('credit_consumed', { pack_id, prompt_id, tipo, novoSaldo } as any)
    window.dispatchEvent(new Event("credits-updated"))
    return novoSaldo
  }

  return { consume }
}