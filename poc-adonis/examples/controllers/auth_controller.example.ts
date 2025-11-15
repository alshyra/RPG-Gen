// Example AdonisJS Controller with Ally (Google OAuth)
// Location in AdonisJS project: app/controllers/auth_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  /**
   * Redirect to Google OAuth
   */
  async redirect({ ally }: HttpContext) {
    return ally.use('google').redirect()
  }

  /**
   * Handle Google OAuth callback
   */
  async callback({ ally, auth, response, session }: HttpContext) {
    const google = ally.use('google')

    // Check if OAuth was denied
    if (google.accessDenied()) {
      return response.redirect('/login?error=access_denied')
    }

    // Check for errors
    if (google.stateMisMatch()) {
      return response.redirect('/login?error=state_mismatch')
    }

    if (google.hasError()) {
      return response.redirect('/login?error=oauth_error')
    }

    // Get user from Google
    const googleUser = await google.user()

    // Find or create user in database
    const user = await User.firstOrCreate(
      { googleId: googleUser.id },
      {
        email: googleUser.email,
        displayName: googleUser.name,
        picture: googleUser.avatarUrl,
      }
    )

    // Login user with session
    await auth.use('web').login(user)

    session.flash('success', 'Welcome back!')
    return response.redirect('/home')
  }

  /**
   * Get authenticated user profile
   */
  async profile({ auth, response }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    return user.serialize()
  }

  /**
   * Logout user
   */
  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Logged out successfully')
    return response.redirect('/')
  }
}
