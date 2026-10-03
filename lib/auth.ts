import { compare } from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'
import { prisma } from './prisma'

declare module 'next-auth' {
  interface User {
    id?: string
    role?: string
  }

  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
  }
}

const PrismaAdapter: any = (() => {
  try {
    return require('@next-auth/prisma-adapter').PrismaAdapter
  } catch {
    return null
  }
})()

const providers = [
  CredentialsProvider({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials) return null
      const { email, password } = credentials
      const normalizedEmail = String(email).trim().toLowerCase()
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (!user || !user.hashedPassword) return null
      const isValid = await compare(String(password), user.hashedPassword)
      if (!isValid) return null
      return {
        id: user.id,
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        role: user.role,
      }
    },
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
]

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter ? PrismaAdapter(prisma as any) : undefined,
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    newUser: '/account',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as any
        token.id = authUser.id
        token.role = authUser.role ?? 'CUSTOMER'
      }

      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id
        }
      }

      return token
    },
    async session({ session, token }) {
      const userId = token?.sub ?? (token as any)?.id
      if (userId) {
        const dbUser = await prisma.user.findUnique({ where: { id: userId } })
        if (dbUser) {
          session.user = {
            ...session.user,
            id: dbUser.id,
            name: dbUser.name ?? undefined,
            email: dbUser.email ?? undefined,
            role: dbUser.role,
          }
          return session
        }
      }

      if (token?.role) {
        session.user = {
          ...session.user,
          role: String(token.role),
        }
      }

      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default authOptions
