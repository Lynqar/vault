import React from 'react'
import { Lock, Plus } from 'lucide-react'

interface Vault {
  id: string
  name: string
  isActive?: boolean
}

// Mock data - in real app, from context
const vaults: Vault[] = [
  { id: 'default', name: 'My Vault', isActive: true },
  { id: 'work', name: 'Work Vault' },
]

interface VaultSidebarProps {
  onSelectVault?: (id: string) => void
  onAddVault?: () => void
}

const VaultSidebar: React.FC<VaultSidebarProps> = ({ onSelectVault, onAddVault }) => {
  return (
    <aside
      className="w-72 min-w-[260px] p-4 bg-surface rounded-xl border border-white/6 flex flex-col gap-3"
      role="navigation"
      aria-label="Vault sidebar"
    >
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-text">Vaults</h2>
      </div>

      {/* Vault list */}
      <div className="flex flex-col gap-1">
        {vaults.map((vault) => (
          <button
            key={vault.id}
            onClick={() => onSelectVault?.(vault.id)}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
              vault.isActive ? 'bg-glass text-text' : 'text-muted hover:bg-white/3 hover:text-text'
            }`}
            aria-selected={vault.isActive}
            role="listitem"
          >
            <Lock className="w-4 h-4" />
            <span className="truncate">{vault.name}</span>
          </button>
        ))}
      </div>

      {/* Add vault button */}
      <button
        onClick={onAddVault}
        className="flex items-center gap-3 p-2 rounded-md text-muted hover:bg-white/3 hover:text-text transition-colors mt-auto"
        aria-label="Add new vault"
      >
        <Plus className="w-4 h-4" />
        <span>Add Vault</span>
      </button>
    </aside>
  )
}

export default VaultSidebar
