import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Shield, AlertTriangle, CheckCircle, Info, TrendingUp,
  Clock, Lock, Eye, EyeOff, Zap, Target, Crown
} from 'lucide-react'
import { useVault } from '../contexts/VaultContext'
import { passwordAuditor } from '../lib/passwordAuditor'
import type { PasswordAuditResult, AuditReport } from '../lib/passwordAuditor'
import { Button } from '../ui'

interface PasswordAuditModalProps {
  isOpen: boolean
  onClose: () => void
}

const PasswordAuditModal: React.FC<PasswordAuditModalProps> = ({ isOpen, onClose }) => {
  const { entries } = useVault()
  const [auditResults, setAuditResults] = useState<PasswordAuditResult[]>([])
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<PasswordAuditResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'recommendations'>('overview')

  // Run audit when modal opens
  useEffect(() => {
    if (isOpen && entries.length > 0) {
      const results = entries.map(entry => passwordAuditor.auditEntry(entry, entries))
      const report = passwordAuditor.generateReport(entries)

      setAuditResults(results)
      setAuditReport(report)

      // Select the most critical entry by default
      const criticalEntry = results.find(r => r.riskLevel === 'critical') ||
                           results.find(r => r.riskLevel === 'high') ||
                           results[0]
      setSelectedEntry(criticalEntry || null)
    }
  }, [isOpen, entries])

  const riskColors = {
    critical: 'bg-error text-text',
    high: 'bg-orange-500 text-text',
    medium: 'bg-yellow-500 text-text',
    low: 'bg-blue-500 text-text',
    secure: 'bg-accent text-text'
  }

  const riskIcons = {
    critical: AlertTriangle,
    high: AlertTriangle,
    medium: Info,
    low: Info,
    secure: CheckCircle
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical': return 'Critical'
      case 'high': return 'High Risk'
      case 'medium': return 'Medium Risk'
      case 'low': return 'Low Risk'
      case 'secure': return 'Secure'
      default: return 'Unknown'
    }
  }

  const OverallScoreCard: React.FC<{ score: number }> = ({ score }) => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-accent'
      if (score >= 60) return 'text-green-500'
      if (score >= 40) return 'text-yellow-500'
      if (score >= 20) return 'text-orange-500'
      return 'text-red-500'
    }

    const getScoreIcon = (score: number) => {
      if (score >= 80) return Crown
      if (score >= 60) return Shield
      if (score >= 40) return AlertTriangle
      return Zap
    }

    const ScoreIcon = getScoreIcon(score)

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-surface border border-border rounded-lg p-6 text-center"
      >
        <ScoreIcon className={`w-12 h-12 mx-auto mb-4 ${getScoreColor(score)}`} />
        <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
          {Math.round(score)}
        </div>
        <div className="text-text-secondary text-sm">Overall Security Score</div>
        <div className="mt-2 text-xs text-text-secondary">
          Out of {auditReport?.totalEntries || 0} passwords
        </div>
      </motion.div>
    )
  }

  const RiskDistribution: React.FC<{ report: AuditReport }> = ({ report }) => {
    const total = report.totalEntries
    const data = [
      { level: 'secure', count: report.secureEntries, percentage: (report.secureEntries / total) * 100 },
      { level: 'low', count: report.riskSummary.low, percentage: (report.riskSummary.low / total) * 100 },
      { level: 'medium', count: report.riskSummary.medium, percentage: (report.riskSummary.medium / total) * 100 },
      { level: 'high', count: report.riskSummary.high, percentage: (report.riskSummary.high / total) * 100 },
      { level: 'critical', count: report.riskSummary.critical, percentage: (report.riskSummary.critical / total) * 100 }
    ].filter(item => item.count > 0)

    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Risk Distribution
        </h3>
        <div className="space-y-3">
          {data.map((item, index) => {
            const Icon = riskIcons[item.level as keyof typeof riskIcons]
            return (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${riskColors[item.level as keyof typeof riskColors].split(' ')[0].replace('bg-', 'text-')}`} />
                  <span className="text-text font-medium">{getRiskLabel(item.level)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      className={`h-full ${riskColors[item.level as keyof typeof riskColors].split(' ')[0]}`}
                    />
                  </div>
                  <span className="text-text-secondary text-sm w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  const SecurityMetrics: React.FC<{ report: AuditReport }> = ({ report }) => {
    const metrics = [
      {
        label: 'Secure Passwords',
        value: report.secureEntries,
        total: report.totalEntries,
        icon: CheckCircle,
        color: 'text-accent'
      },
      {
        label: 'Breach Incidents',
        value: report.recentBreachIncidents,
        total: report.totalEntries,
        icon: AlertTriangle,
        color: report.recentBreachIncidents > 0 ? 'text-red-500' : 'text-accent'
      },
      {
        label: 'Password Reuse',
        value: report.passwordReuseCount,
        total: report.totalEntries,
        icon: Zap,
        color: report.passwordReuseCount > 0 ? 'text-orange-500' : 'text-accent'
      },
      {
        label: 'Avg Age (days)',
        value: Math.round(report.averagePasswordAge),
        total: null,
        icon: Clock,
        color: 'text-blue-500'
      }
    ]

    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface border border-border rounded-lg p-4 text-center"
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${metric.color}`} />
              <div className="text-lg font-bold text-text">
                {metric.value}
                {metric.total !== null && (
                  <span className="text-text-secondary text-sm">/{metric.total}</span>
                )}
              </div>
              <div className="text-text-secondary text-xs">{metric.label}</div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const PasswordEntryCard: React.FC<{ result: PasswordAuditResult }> = ({ result }) => {
    const Icon = riskIcons[result.riskLevel]
    const [showPassword, setShowPassword] = useState(false)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-lg p-4 cursor-pointer hover:bg-surface/80 transition-colors"
        onClick={() => setSelectedEntry(result)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${riskColors[result.riskLevel].split(' ')[0].replace('bg-', 'text-')}`} />
            <div>
              <h4 className="font-medium text-text">{result.entry.title}</h4>
              <p className="text-text-secondary text-sm">{result.entry.url || 'No URL'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-2 py-1 rounded text-xs font-medium ${riskColors[result.riskLevel]}`}>
              {getRiskLabel(result.riskLevel)}
            </div>
            <div className="text-text-secondary text-xs mt-1">
              {Math.round(result.score)}%
            </div>
          </div>
        </div>

        {/* Password preview */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Password:</span>
          <span className="font-mono bg-muted/20 px-2 py-1 rounded flex-1 truncate">
            {showPassword
              ? result.entry.password || 'No password'
              : '•'.repeat((result.entry.password || '').length || 8)
            }
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPassword(!showPassword)
            }}
            className="p-1 text-text-secondary hover:text-text"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Risk indicators */}
        <div className="flex flex-wrap gap-1 mt-3">
          {Object.entries(result.risks).map(([risk, active]) => {
            if (!active) return null
            return (
              <span key={risk} className="px-2 py-1 bg-error/10 text-error text-xs rounded">
                {risk.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
            )
          })}
        </div>
      </motion.div>
    )
  }

  const RecommendationsList: React.FC<{ report: AuditReport }> = ({ report }) => {
    const priorityColors = {
      critical: 'border-error bg-error/5',
      high: 'border-orange-500 bg-orange-500/5',
      medium: 'border-yellow-500 bg-yellow-500/5',
      low: 'border-blue-500 bg-blue-500/5'
    }

    const priorityIcons = {
      critical: AlertTriangle,
      high: AlertTriangle,
      medium: Info,
      low: CheckCircle
    }

    return (
      <div className="space-y-4">
        {report.topRecommendations.map((rec, index) => {
          const Icon = priorityIcons[rec.priority]
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border-l-4 rounded-lg p-4 ${priorityColors[rec.priority]}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${
                  rec.priority === 'critical' ? 'text-error' :
                  rec.priority === 'high' ? 'text-orange-500' :
                  rec.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-text mb-1">{rec.title}</h4>
                  <p className="text-text-secondary text-sm mb-2">{rec.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-surface rounded text-text-secondary capitalize">
                      {rec.action}
                    </span>
                    <span className={`px-2 py-1 rounded capitalize ${
                      rec.estimatedImpact === 'high' ? 'bg-error/10 text-error' :
                      rec.estimatedImpact === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-blue-500/10 text-blue-600'
                    }`}>
                      {rec.estimatedImpact} impact
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">Password Security Audit</h2>
                <p className="text-text-secondary text-sm">Comprehensive security analysis of your passwords</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-text transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col max-h-[calc(90vh-120px)]">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'entries', label: 'Passwords', icon: Lock },
                { id: 'recommendations', label: 'Actions', icon: Target }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && auditReport && (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <OverallScoreCard score={auditReport.overallSecurityScore} />
                    <RiskDistribution report={auditReport} />
                  </div>

                  {/* Security Metrics */}
                  <SecurityMetrics report={auditReport} />

                  {/* Security Tips */}
                  <div className="bg-surface border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-accent" />
                      Security Best Practices
                    </h3>
                    <div className="grid gap-3">
                      {passwordAuditor.getSecurityTips().map((tip, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                          <span className="text-text-secondary">{tip}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'entries' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-text">
                      Password Risk Assessment ({auditResults.length} total)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAuditResults([...auditResults].sort((a, b) => a.score - b.score))}
                        className="px-3 py-1 text-sm bg-accent hover:bg-accent/90 text-text rounded"
                      >
                        Show Riskiest First
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {auditResults.map((result) => (
                      <PasswordEntryCard key={result.entry.id} result={result} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'recommendations' && auditReport && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text mb-2">
                      Top Security Recommendations
                    </h3>
                    <p className="text-text-secondary text-sm mb-6">
                      Actionable steps to improve your password security
                    </p>
                    <RecommendationsList report={auditReport} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PasswordAuditModal
