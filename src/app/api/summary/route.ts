import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse, sessionOptions);
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this-month';
    const categoryIds = searchParams.getAll('categoryIds[]');
    const payer = searchParams.get('payer');

    // Calculate date range based on period
    let from: Date;
    let to: Date;

    const now = new Date();
    switch (period) {
      case 'this-month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'custom':
        from = new Date(searchParams.get('from') || startOfMonth(now));
        to = new Date(searchParams.get('to') || endOfMonth(now));
        break;
      default:
        from = startOfMonth(now);
        to = endOfMonth(now);
    }

    const where: any = {
      occurredAt: {
        gte: from,
        lte: to,
      },
    };

    if (categoryIds.length > 0) {
      where.categoryId = { in: categoryIds };
    }

    if (payer && (payer === 'owner' || payer === 'partner')) {
      where.payerUserId = payer;
    }

    // Get total spending
    const totalSpending = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    });

    // Get spending by category
    const spendingByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const categories = await prisma.category.findMany({
      where: categoryIds.length > 0 ? { id: { in: categoryIds } } : undefined,
    });

    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    const categoryData = spendingByCategory.map(item => ({
      categoryId: item.categoryId,
      categoryName: categoryMap.get(item.categoryId) || 'Unknown',
      amount: item._sum.amount || 0,
      count: item._count,
      percentage: totalSpending._sum.amount ? 
        ((item._sum.amount || 0) / totalSpending._sum.amount) * 100 : 0,
    }));

    // Get spending by payer
    const spendingByPayer = await prisma.transaction.groupBy({
      by: ['payerUserId'],
      where,
      _sum: { amount: true },
    });

    const users = await prisma.user.findMany();
    const userMap = new Map(users.map(user => [user.id, user.displayName]));
    
    const payerData = spendingByPayer.map(item => ({
      payerId: item.payerUserId,
      payerName: userMap.get(item.payerUserId) || 'Unknown',
      amount: item._sum.amount || 0,
    }));

    // Get detailed transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        payer: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });

    return NextResponse.json({
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      totalSpending: totalSpending._sum.amount || 0,
      spendingByCategory: categoryData,
      spendingByPayer: payerData,
      transactions,
    });
  } catch (error) {
    console.error('Summary GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
