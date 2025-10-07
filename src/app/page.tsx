import { redirect } from 'next/navigation'
import LoginPage from '@/components/LoginPage'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { headers } from 'next/headers'

async function checkAuth() {
  try {
    const headersList = headers()
    const session = await getIronSession<SessionData>({
      req: { headers: headersList } as any,
      res: {} as any,
    }, sessionOptions)
    
    if (session.isLoggedIn && session.userId) {
      redirect('/dashboard')
    }
  } catch (error) {
    // If there's an error, just show login page
  }
}

export default async function Home() {
  await checkAuth()
  return <LoginPage />
}
