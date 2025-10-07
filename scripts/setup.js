#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Budgety...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('📝 Please create .env.local with the following variables:');
  console.log(`
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?sslmode=require"
AUTH_CODE="123456"
OWNER_NAME="Dor"
PARTNER_NAME="Partner"
SESSION_SECRET="super-long-random-string-at-least-32-characters"
  `);
  console.log('\n💡 Copy from env.example and update with your values.');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('🗄️  Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('🌱 Seeding database...');
  execSync('node prisma/seed.js', { stdio: 'inherit' });

  console.log('\n✅ Setup complete!');
  console.log('🚀 Run "npm run dev" to start the development server.');
  console.log('🌐 Visit http://localhost:3000 to access the app.');
  console.log('\n📋 Default login:');
  console.log('   User: Owner or Partner');
  console.log('   Code: 123456 (or your AUTH_CODE)');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
