import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { queryPrimary } from './db/mysql-primary'

interface User {
  id: number
  username: string
  name: string | null
  email: string | null
  password: string
  active: number | null
}

interface Role {
  id: number
  name: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Get user
          const users = await queryPrimary<User[]>(
            'SELECT * FROM Users WHERE username = ? AND active = 1',
            [credentials.username]
          )

          const user = users[0]

          if (!user || !user.password) {
            return null
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            return null
          }

          // Get user roles
          const roles = await queryPrimary<Role[]>(
            `SELECT r.id, r.name 
             FROM roles r
             INNER JOIN user_roles ur ON r.id = ur.roleId
             WHERE ur.userId = ?`,
            [user.id]
          )

          const roleNames = roles.map(r => r.name)

          return {
            id: user.id.toString(),
            name: user.name || user.username,
            email: user.email || '',
            username: user.username,
            roles: roleNames
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.roles = token.roles as string[]
        
        // Create initials from name
        const nameParts = session.user.name?.split(' ') || ['U']
        session.user.initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
          : nameParts[0].substring(0, 2).toUpperCase()
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}