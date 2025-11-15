import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Palette } from 'lucide-react'
import { ThemeManager, VAULT_THEMES, type Theme } from '../lib/security'

const ThemeSelector: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>(ThemeManager.getInstance().getCurrentThemeName())

  useEffect(() => {
    const handleThemeChange = () => {
      setSelectedTheme(ThemeManager.getInstance().getCurrentThemeName())
    }

    window.addEventListener('themeChanged', handleThemeChange)
    return () => window.removeEventListener('themeChanged', handleThemeChange)
  }, [])

  const handleThemeSelect = (themeName: string) => {
    ThemeManager.getInstance().setTheme(themeName)
    setSelectedTheme(themeName)
  }

  const renderThemePreview = (theme: Theme) => {
    const colors = theme.colors
    const isGradient = theme.gradients && colors.background.includes('gradient')

    return (
      <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-accent/50 transition-colors cursor-pointer">
        {/* Background preview */}
        {isGradient ? (
          <div
            className="w-full h-full"
            style={{ background: colors.background }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: colors.background }}
          />
        )}

        {/* Surface preview */}
        <div
          className="absolute bottom-2 left-2 right-2 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          {/* Text preview */}
          <div
            className="text-xs font-medium leading-tight"
            style={{ color: colors.text }}
          >
            Aa
          </div>
        </div>

        {/* Accent dot */}
        <div
          className="absolute top-2 right-2 w-3 h-3 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />

        {/* Selection checkmark */}
        {selectedTheme === theme.name && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-white rounded-full p-1">
              <Check className="w-4 h-4 text-black" />
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center">
          <Palette className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text">Vault Themes</h3>
          <p className="text-sm text-text-secondary">Choose a visual theme for your password vault</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {VAULT_THEMES.map((theme) => (
          <motion.div
            key={theme.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleThemeSelect(theme.name)}
            className="space-y-2"
          >
            {renderThemePreview(theme)}

            <div className="text-center">
              <h4 className="font-medium text-text text-sm">{theme.displayName}</h4>
              <p className="text-xs text-text-secondary leading-tight">
                {theme.description}
              </p>
              {theme.amoled && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-success/20 text-success rounded-full text-xs">
                  Battery Saver
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 p-4 bg-surface/50 rounded-lg"
      >
        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
          <Check className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h4 className="font-medium text-text">Theme Applied</h4>
          <p className="text-sm text-text-secondary">
            Your preference is saved automatically and synced across devices
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default ThemeSelector
