// Example AdonisJS Controller with Inertia
// Location in AdonisJS project: app/controllers/home_controller.ts

import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  /**
   * Display home page (protected route)
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.user!

    // Load user's characters
    await user.load('characters')

    return inertia.render('home', {
      user: user.serialize(),
      characters: user.characters.map((char) => char.serialize()),
    })
  }

  /**
   * Example: Load game page
   */
  async game({ inertia, auth, params }: HttpContext) {
    const user = auth.user!
    const characterId = params.characterId

    // Load character with chat history
    const character = await user
      .related('characters')
      .query()
      .where('id', characterId)
      .preload('chatHistory')
      .firstOrFail()

    return inertia.render('game', {
      user: user.serialize(),
      character: character.serialize(),
      messages: character.chatHistory.map((msg) => msg.serialize()),
    })
  }
}
