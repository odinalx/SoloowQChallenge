import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function useDDragonVersion() {
  const [version, setVersion] = useState('14.24.1')

  useEffect(() => {
    api.getDDragonVersion()
      .then(v => setVersion(v))
      .catch(() => {})
  }, [])

  return version
}
