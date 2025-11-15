// Example AdonisJS Lucid Model
// Location in AdonisJS project: app/models/user.ts

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Character from './character.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare displayName: string | null

  @column()
  declare picture: string | null

  @column()
  declare googleId: string

  // Relations
  @hasMany(() => Character)
  declare characters: HasMany<typeof Character>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Serialize for JSON (exclude sensitive data if needed)
  serialize() {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      picture: this.picture,
    }
  }
}
