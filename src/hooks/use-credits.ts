import { supabase } from '@/integrations/supabase/client'
import { useDeviceId } from './use-device-id'
import { useTracking } from './use-tracking'

export function useCredits() {
  const { getId } = useDeviceId()
  const { track } = useTracking()

  const consume = async (tipo: 'consumo_copia' | 'consumo_geracao', pack_id: string, prompt_id?: string) => {
    const device_id = getId()
    // sua função que já impede saldo negativo
    const { data } = await supabase.rpc('charge_credit', { _device_id: device_id, _custo: 0.01 } as any)
    
    await supabase.from('credit_transactions').insert({
      device_id,
      tipo,
      pack_id,
      prompt_id: prompt_id || null,
      qtd: -1,
    } as any)
    
    track('credit_consumed', { pack_id, prompt_id, tipo })
    return data
  }
  return { consume }
}