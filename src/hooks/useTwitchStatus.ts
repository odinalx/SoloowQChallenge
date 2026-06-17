import { useEffect, useState } from 'react'

export function useTwitchStatus(login: string | undefined) {
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!login) return
    const check = () => {
      fetch(`/api/twitch/status/${login}`)
        .then(r => r.json())
        .then((d: { isLive: boolean }) => setIsLive(d.isLive))
        .catch(() => setIsLive(false))
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [login])

  return isLive
}
