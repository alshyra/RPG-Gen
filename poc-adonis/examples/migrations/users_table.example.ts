// Example AdonisJS Lucid Migration
// Location in AdonisJS project: database/migrations/xxx_create_users_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      // User info from Google OAuth
      table.string('email', 255).notNullable().unique()
      table.string('display_name', 255)
      table.string('picture', 512)
      table.string('google_id', 255).notNullable().unique()
      
      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
