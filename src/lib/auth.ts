import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next';
import { NextApiRequest, NextApiResponse, GetServerSidePropsContext } from 'next';
import { SessionData, sessionOptions } from './session';
import { prisma } from './prisma';

export function withSessionRoute(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withSessionSsr(handler: (context: GetServerSidePropsContext) => Promise<any>) {
  return withIronSessionSsr(handler, sessionOptions);
}

export async function validateAuth(req: NextApiRequest): Promise<{ userId: string; user: any } | null> {
  const session = req.session as SessionData;
  
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return null;
  }

  return { userId: session.userId, user };
}

export async function validateAuthCode(code: string, userId: string): Promise<boolean> {
  const authCode = process.env.AUTH_CODE;
  return authCode === code && (userId === 'owner' || userId === 'partner');
}
