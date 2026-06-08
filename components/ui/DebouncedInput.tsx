"use client"

import React, { useEffect, useState } from "react"
import styles from "./debounced-input.module.css"
import useDebounce from "@/hooks/useDebounce"

interface DebouncedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDebouncedChange?: (value: string) => void
  debounce?: number
}

export const DebouncedInput = ({
  value,
  onChange,
  onDebouncedChange,
  debounce = 150,
  className = "",
  ...rest
}: DebouncedInputProps) => {
  const [pulseKey, setPulseKey] = useState(0)
  const debouncedValue = useDebounce(value, debounce)

  useEffect(() => {
    // trigger a short pulse animation whenever visible value changes
    setPulseKey((k) => k + 1)
  }, [value])

  useEffect(() => {
    if (onDebouncedChange) onDebouncedChange(debouncedValue)
  }, [debouncedValue, onDebouncedChange])

  // toggle class briefly when pulseKey changes
  const [isPulsing, setIsPulsing] = useState(false)
  useEffect(() => {
    setIsPulsing(true)
    const t = setTimeout(() => setIsPulsing(false), 160)
    return () => clearTimeout(t)
  }, [pulseKey])

  return (
    <input
      {...rest}
      value={value}
      onChange={onChange}
      className={`${styles.input} ${isPulsing ? styles.pulse : ""} ${className}`}
    />
  )
}

export default DebouncedInput
