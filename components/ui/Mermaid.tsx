"use client"

import { useEffect, useRef } from "react"

interface MermaidProps {
  chart: string
  theme?: "dark" | "default"
}

export default function Mermaid({ chart, theme = "dark" }: MermaidProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAndRender() {
      // load mermaid from CDN if not already present
      if (!(window as any).mermaid) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"
          s.onload = () => resolve()
          s.onerror = () => reject()
          document.head.appendChild(s)
        }).catch(() => {
          if (ref.current && !cancelled) ref.current.textContent = "Failed to load diagram renderer"
          return
        })
      }

      const mermaid = (window as any).mermaid
      if (!mermaid || cancelled) return

      try {
        mermaid.initialize({ startOnLoad: false, theme: theme === "dark" ? "dark" : "default" })
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, chart)
        if (ref.current && !cancelled) ref.current.innerHTML = svg
      } catch (err) {
        if (ref.current && !cancelled) ref.current.textContent = "Diagram failed to render"
      }
    }

    loadAndRender()
    return () => {
      cancelled = true
    }
  }, [chart, theme])

  return <div ref={ref} className="w-full overflow-auto" />
}
