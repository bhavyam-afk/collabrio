import { useEffect, useState } from "react"

export default function useDebounce<T>(value: T, delay = 150) {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
