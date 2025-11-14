import React, { useState, useEffect } from 'react'
import { Copy } from 'lucide-react'
import { generateTOTPToken, formatTOTPTime, getTOTPProgress, type TOTPResult } from '../lib/totp'

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
        await navigator.clipboard.writeText(totpResult.token)
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
    <div className="flex items-center space-x-2 bg-slate-700 rounded px-3 py-2">
      {/* TOTP Code */}
      <span className="font-mono text-lg font-bold text-white tracking-wider">
        {totpResult.token}
      </span>

      {/* Countdown Progress */}
      <div className="relative">
        <div className="w-6 h-6 rounded-full border-2 border-slate-600">
          <div
            className="absolute inset-0 rounded-full transition-colors duration-1000"
            style={{
              background: `conic-gradient(from 0deg, ${
                totpResult.remaining <= 5 ? '#ef4444' : '#10b981'
              } 0deg, ${
                totpResult.remaining <= 5 ? '#ef4444' : '#10b981'
              } ${(getTOTPProgress(totpResult.remaining) * 3.6)}deg, transparent ${(getTOTPProgress(totpResult.remaining) * 3.6)}deg)`
            }}
          />
        </div>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
          totpResult.remaining <= 5 ? 'text-red-400' : 'text-green-400'
        }`}>
          {formatTOTPTime(totpResult.remaining)}
        </span>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="p-1 text-slate-400 hover:text-white transition-colors"
        title="Copy TOTP code"
      >
        <Copy className="w-4 h-4" />
      </button>
    </div>
  )
}

export default TOTPCodeDisplay
