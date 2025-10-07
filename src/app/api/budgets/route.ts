import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');

    // Parse month to get start and end dates
    const monthDate = new Date(month + '-01');
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    // Get all categories with their default budgets
    const categories = await prisma.category.findMany({
      include: {
        budgetOverrides: {
          where: { month },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get spending for this month for each category
    const spendingData = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        occurredAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const spendingMap = new Map(
      spendingData.map(item => [item.categoryId, item._sum.amount || 0])
    );

    // Calculate effective budgets and remaining amounts
    const budgetData = categories.map(category => {
      const effectiveBudget = category.budgetOverrides[0]?.amount || 
                             category.defaultBudgetAmount || 0;
      const spent = spendingMap.get(category.id) || 0;
      const left = effectiveBudget - spent;

      return {
        categoryId: category.id,
        categoryName: category.name,
        defaultBudget: category.defaultBudgetAmount,
        overrideBudget: category.budgetOverrides[0]?.amount,
        effectiveBudget,
        spent,
        left,
        hasOverride: category.budgetOverrides.length > 0,
      };
    });

    return NextResponse.json({
      month,
      budgets: budgetData,
    });
  } catch (error) {
    console.error('Budgets GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse, sessionOptions);
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { type, categoryId, amount, month } = await request.json();

    if (type === 'default') {
      // Update default budget for category
      const category = await prisma.category.update({
        where: { id: categoryId },
        data: { defaultBudgetAmount: amount },
      });

      return NextResponse.json(category);
    } else if (type === 'override') {
      // Create or update monthly override
      const budgetOverride = await prisma.budgetOverride.upsert({
        where: {
          categoryId_month: {
            categoryId,
            month,
          },
        },
        update: { amount },
        create: {
          categoryId,
          month,
          amount,
        },
      });

      return NextResponse.json(budgetOverride);
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "default" or "override"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Budgets PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
