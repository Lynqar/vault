import React, { useState, useEffect } from 'react'
import { Copy } from 'lucide-react'
import { generateTOTPToken, formatTOTPTime, getTOTPProgress, type TOTPResult } from '../lib/totp'
import { copyTOTPCode, getClipboardAutoClearEnabled } from '../lib/clipboard'

interface TOTPCodeDisplayProps {
  secret: string
  onCopy?: (token: string) => void
}

const TOTPCodeDisplay: React.FC<TOTPCodeDisplayProps> = ({ secret, onCopy }) => {
  const [totpResult, setTotpResult] = useState<TOTPResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Update TOTP code every second
  useEffect(() => {
    const updateToken = () => {
      try {
        const result = generateTOTPToken(secret)
        setTotpResult(result)
        setError(null)
      } catch (err) {
        setError('Invalid TOTP secret')
      }
    }

    updateToken()
    const interval = setInterval(updateToken, 1000)

    return () => clearInterval(interval)
  }, [secret])

  const handleCopy = async () => {
    if (totpResult?.token) {
      try {
        await copyTOTPCode(totpResult.token)
        onCopy?.(totpResult.token)
      } catch (err) {
        console.error('Failed to copy TOTP code:', err)
      }
    }
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Invalid TOTP secret
      </div>
    )
  }

  if (!totpResult) {
    return (
      <div className="animate-pulse bg-slate-700 rounded px-2 py-1 text-sm">
        <span className="invisible">000000</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20">
      {/* TOTP Code */}
      <span className="font-mono font-bold text-text tracking-wider">
        {totpResult.token}
      </span>

      {/* Countdown Progress Ring */}
      <div className="relative w-4 h-4">
        <svg width="16" height="16" className="transform -rotate-90">
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-glass opacity-50"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke={totpResult.remaining <= 5 ? 'var(--error, #ef4444)' : 'var(--success, #10b981)'}
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${(getTOTPProgress(totpResult.remaining) / 100) * 37.68} 37.68`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${
            totpResult.remaining <= 5 ? 'text-red-400' : 'text-green-400'
          }`}>
            {formatTOTPTime(totpResult.remaining)}
          </span>
        </div>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="p-1 text-muted hover:text-text transition-colors"
        title="Copy TOTP code"
        aria-label="Copy TOTP code"
      >
        <Copy className="w-3 h-3" />
      </button>
    </div>
  )
}

export default TOTPCodeDisplay
