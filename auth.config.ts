import type { NextAuthConfig } from 'next-auth'
import LinkedIn from 'next-auth/providers/linkedin'

// Edge-safe auth config — no Node.js-only imports (fs, path, etc.)
// Used by middleware.ts which runs in the Edge Runtime.
export const authConfig: NextAuthConfig = {
  providers: [
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth }) {
      // Delegate actual role checks to middleware or server-side layouts.
      // Just confirm the user is authenticated.
      return !!auth
    },
  },
}
