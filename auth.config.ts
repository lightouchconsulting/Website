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
      return !!auth
    },
    async jwt({ token }) {
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        role: token.role as string,
        linkedinId: token.linkedinId as string,
        projects: token.projects as string[],
      }
      return session
    },
  },
}
