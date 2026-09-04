import { supabase } from '@/integrations/supabase/client'
import { useDeviceId } from './use-device-id'

export function useTracking() {
  const { getId } = useDeviceId()
  const track = async (evento: string, data: any = {}) => {
    try {
      const device_id = getId()
      await supabase.from('user_events').insert({
        device_id,
        evento,
        pack_id: data.pack_id || null,
        prompt_id: data.prompt_id || null,
        metadata: data
      })
    } catch (e) {
      console.log('track error', e)
    }
  }
  return { track }
}