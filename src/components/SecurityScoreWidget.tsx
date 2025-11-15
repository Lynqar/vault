import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Trophy, TrendingUp, Star, Crown, Medal,
  Target, Zap, CheckCircle, Check, ArrowUp, Info
} from 'lucide-react'
import { useVault } from '../contexts/VaultContext'
import { securityScorer, type SecurityScore, type Achievement } from '../lib/securityScorer'
import { Button } from '../ui'

interface SecurityScoreWidgetProps {
  compact?: boolean
  showDetails?: boolean
  onViewFullScore?: () => void
}

const SecurityScoreWidget: React.FC<SecurityScoreWidgetProps> = ({
  compact = false,
  showDetails = true,
  onViewFullScore
}) => {
  const { entries, unlocked } = useVault()
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)

  // Calculate score when entries change
  useEffect(() => {
    if (unlocked && entries.length >= 0) {
      const score = securityScorer.calculateScore(entries)
      setSecurityScore(score)

      // Save achievement progress
      securityScorer.saveAchievementProgress()
    }
  }, [entries, unlocked])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-accent'
    if (score >= 70) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    if (score >= 30) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-accent/10'
    if (score >= 70) return 'bg-green-500/10'
    if (score >= 50) return 'bg-yellow-500/10'
    if (score >= 30) return 'bg-orange-500/10'
    return 'bg-red-500/10'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return Crown
    if (score >= 70) return Shield
    if (score >= 50) return Target
    return Zap
  }

  const AchievementBadge: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const rarityColors = {
      common: 'bg-gray-100 text-gray-700 border-gray-200',
      rare: 'bg-blue-100 text-blue-700 border-blue-200',
      epic: 'bg-purple-100 text-purple-700 border-purple-200',
      legendary: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200'
    }

    if (!achievement.unlocked && !achievement.progress) return null

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`relative p-3 rounded-lg border ${rarityColors[achievement.rarity]} ${
          achievement.unlocked ? 'shadow-md' : 'opacity-60'
        }`}
      >
        {achievement.unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center"
          >
            <Check className="w-2 h-2 text-white" />
          </motion.div>
        )}

        <div className="text-center">
          <div className="text-2xl mb-1">{achievement.icon}</div>
          <div className="text-xs font-medium">{achievement.name}</div>
          <div className="text-xs opacity-75 mt-1">{achievement.description}</div>

          {/* Progress bar for unlocked achievements */}
          {!achievement.unlocked && achievement.progress && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(achievement.progress.current / achievement.progress.target) * 100}%` }}
                  className="bg-accent h-1 rounded-full"
                />
              </div>
              <div className="text-xs mt-1">
                {achievement.progress.current}/{achievement.progress.target}
              </div>
            </div>
          )}

          {/* Unlock date for unlocked achievements */}
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="text-xs mt-1 opacity-50">
              Unlocked {achievement.unlockedAt.toLocaleDateString()}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  if (!unlocked) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 text-center">
        <Shield className="w-8 h-8 mx-auto mb-2 text-muted" />
        <p className="text-muted text-sm">Unlock vault to view security score</p>
      </div>
    )
  }

  if (!securityScore || entries.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 text-center">
        <Shield className="w-8 h-8 mx-auto mb-2 text-muted" />
        <p className="text-muted text-sm">Add passwords to see your security score</p>
      </div>
    )
  }

  if (compact) {
    const ScoreIcon = getScoreIcon(securityScore.totalScore)
    return (
      <motion.div
        className={`cursor-pointer ${getScoreBgColor(securityScore.totalScore)} border border-border rounded-lg p-4`}
        whileHover={{ scale: 1.02 }}
        onClick={() => onViewFullScore && onViewFullScore()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoreIcon className={`w-8 h-8 ${getScoreColor(securityScore.totalScore)}`} />
            <div>
              <div className={`text-2xl font-bold ${getScoreColor(securityScore.totalScore)}`}>
                {securityScore.totalScore}
              </div>
              <div className="text-text-secondary text-sm">
                Level {securityScore.level.current}: {securityScore.level.title}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {securityScore.achievements.filter(a => a.unlocked).slice(0, 3).map(achievement => (
              <span key={achievement.id} className="text-lg">{achievement.icon}</span>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Progress to next level</span>
            <span>{securityScore.level.progressToNext}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${securityScore.level.progressToNext}%` }}
              className="bg-accent h-1.5 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${getScoreBgColor(securityScore.totalScore)} border border-border rounded-lg p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text mb-1">Security Score</h3>
            <p className="text-text-secondary text-sm">Your overall password security health</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Shield className={`w-6 h-6 ${getScoreColor(securityScore.totalScore)}`} />
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-6xl font-bold mb-2 ${getScoreColor(securityScore.totalScore)}`}
          >
            {securityScore.totalScore}
          </motion.div>
          <div className={`text-lg font-medium ${getScoreColor(securityScore.totalScore)}`}>
            Level {securityScore.level.current}: {securityScore.level.title}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Progress to next level</span>
            <span>{securityScore.level.progressToNext}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${securityScore.level.progressToNext}%` }}
              className="bg-accent h-2 rounded-full"
            />
          </div>
        </div>

        {/* Recommendations */}
        {securityScore.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text flex items-center gap-2">
              <Info className="w-4 h-4" />
              Quick Actions
            </h4>
            {securityScore.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-text-secondary bg-white/10 rounded px-3 py-2"
              >
                {rec}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Score Breakdown */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-lg p-4"
        >
          <h4 className="font-medium text-text mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Score Breakdown
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(securityScore.breakdown).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-lg font-semibold text-text">{value}%</div>
                <div className="text-xs text-text-secondary capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
              </div>
            ))}
          </div>

          {securityScore.bonuses.criticalSecurity > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-center">
                <div className="text-sm font-medium text-accent">
                  +{securityScore.bonuses.criticalSecurity}% Critical Bonus
                </div>
                <div className="text-xs text-text-secondary">for protecting critical accounts</div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-border rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-text flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            Achievements
          </h4>
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="text-accent hover:text-accent/80 text-sm"
          >
            {showAchievements ? 'Hide' : 'Show'} All
          </button>
        </div>

        <AnimatePresence>
          {showAchievements ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {securityScore.achievements.map(achievement => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </motion.div>
          ) : (
            <div className="flex gap-2 overflow-x-auto">
              {securityScore.achievements.filter(a => a.unlocked).slice(0, 5).map(achievement => (
                <div key={achievement.id} className="flex-shrink-0">
                  <AchievementBadge achievement={achievement} />
                </div>
              ))}
              {securityScore.achievements.filter(a => a.unlocked).length === 0 && (
                <div className="text-center text-text-secondary py-4">
                  Complete security tasks to unlock achievements!
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onViewFullScore && (
          <Button onClick={onViewFullScore} className="flex-1">
            View Full Audit
          </Button>
        )}
        <button
          onClick={() => window.open('https://haveibeenpwned.com/', '_blank')}
          className="flex-1 px-4 py-2 bg-transparent border border-accent text-accent hover:bg-accent/10 rounded-lg transition-colors font-medium"
        >
          Check Breaches
        </button>
      </div>
    </div>
  )
}

export default SecurityScoreWidget
