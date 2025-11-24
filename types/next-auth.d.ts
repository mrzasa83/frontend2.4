import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    email: string
    name: string
    roles: string[]
  }

  interface Session {
    user: User & {
      initials: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    roles: string[]
  }
}