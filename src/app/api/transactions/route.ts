import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const categoryIds = searchParams.getAll('categoryIds[]');
    const payer = searchParams.get('payer');

    const where: any = {};

    if (from || to) {
      where.occurredAt = {};
      if (from) where.occurredAt.gte = new Date(from);
      if (to) where.occurredAt.lte = new Date(to);
    }

    if (categoryIds.length > 0) {
      where.categoryId = { in: categoryIds };
    }

    if (payer && (payer === 'owner' || payer === 'partner')) {
      where.payerUserId = payer;
    }

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

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse, sessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { amount, categoryId, note, occurredAt } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        categoryId,
        payerUserId: session.userId,
        note: note || null,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
      include: {
        category: true,
        payer: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
