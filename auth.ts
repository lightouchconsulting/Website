import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { resolveRole } from '@/lib/roles'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const linkedinId = (profile as Record<string, unknown>).sub as string | undefined
        if (!linkedinId) {
          token.role = 'unauthorized'
          token.linkedinId = ''
          token.projects = []
          return token
        }
        const resolved = await resolveRole(linkedinId)
        if (!resolved) {
          token.role = 'unauthorized'
          token.linkedinId = linkedinId
          token.projects = []
          return token
        }
        token.role = resolved.role
        token.linkedinId = linkedinId
        token.projects = resolved.projects
      }
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
})
