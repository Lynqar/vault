import Dexie from 'dexie'

export class LynqarDB extends Dexie {
  entries: Dexie.Table<{ id: string; encrypted: string }, string>
  meta: Dexie.Table<{ key: string; value: string }, string>

  constructor() {
    super('lynqar-vault')
    this.version(1).stores({
      entries: 'id, encrypted',
      meta: 'key, value'
    })
    this.entries = this.table('entries')
    this.meta = this.table('meta')
  }
}

export const db = new LynqarDB()
