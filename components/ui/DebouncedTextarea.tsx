"use client"

import React, { useEffect, useState } from "react"
import styles from "./debounced-input.module.css"
import useDebounce from "@/hooks/useDebounce"

interface DebouncedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onDebouncedChange?: (value: string) => void
  debounce?: number
}

export const DebouncedTextarea = ({
  value,
  onChange,
  onDebouncedChange,
  debounce = 150,
  className = "",
  ...rest
}: DebouncedTextareaProps) => {
  const [pulseKey, setPulseKey] = useState(0)
  const debouncedValue = useDebounce(value, debounce)

  useEffect(() => setPulseKey((k) => k + 1), [value])

  useEffect(() => {
    if (onDebouncedChange) onDebouncedChange(debouncedValue)
  }, [debouncedValue, onDebouncedChange])

  const [isPulsing, setIsPulsing] = useState(false)
  useEffect(() => {
    setIsPulsing(true)
    const t = setTimeout(() => setIsPulsing(false), 160)
    return () => clearTimeout(t)
  }, [pulseKey])

  return (
    <textarea
      {...rest}
      value={value}
      onChange={onChange}
      className={`${styles.input} ${isPulsing ? styles.pulse : ""} ${className}`}
    />
  )
}

export default DebouncedTextarea
