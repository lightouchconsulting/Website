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
        token.linkedinId = (profile as Record<string, unknown>).sub as string ?? (profile as Record<string, unknown>).id as string
        token.role = adminIds.includes(token.linkedinId as string) ? 'admin' : 'user'
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
