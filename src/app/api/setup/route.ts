import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is a one-time setup endpoint for production deployment
// Should be removed after initial setup for security
export async function POST(request: NextRequest) {
  try {
    // Simple security check - you can remove this after setup
    const { setupKey } = await request.json();
    if (setupKey !== process.env.AUTH_CODE) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 401 }
      );
    }

    console.log('Setting up database...');

    // Create users
    await prisma.user.upsert({
      where: { id: 'owner' },
      update: { displayName: "דור", isOwner: true },
      create: { id: 'owner', displayName: "דור", isOwner: true },
    });
    
    await prisma.user.upsert({
      where: { id: 'partner' },
      update: { displayName: "הילה", isOwner: false },
      create: { id: 'partner', displayName: "הילה", isOwner: false },
    });

    console.log('Database setup complete!');

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully!' 
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
