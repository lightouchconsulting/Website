import NextAuth from 'next-auth'
import LinkedIn from 'next-auth/providers/linkedin'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const adminIds = (process.env.ADMIN_LINKEDIN_IDS ?? '').split(',').map(s => s.trim())
        const linkedinId = (profile as Record<string, unknown>).sub as string | undefined
        if (!linkedinId) {
          token.role = 'user'
          return token
        }
        token.linkedinId = linkedinId
        token.role = adminIds.includes(linkedinId) ? 'admin' : 'user'
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        role: token.role as string,
        linkedinId: token.linkedinId as string,
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
