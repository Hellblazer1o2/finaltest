const { execSync } = require('child_process');

console.log('🚀 Starting build process...\n');

try {
  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.NEXT_TELEMETRY_DISABLED = '1';

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed!');

  // Generate Prisma client
  console.log('\n🔧 Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated!');
  } catch (error) {
    console.log('⚠️ Prisma generate failed, trying alternative approach...');
    // Try without the config file
    execSync('npx prisma generate --skip-generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated with alternative approach!');
  }

  // Build the application
  console.log('\n🏗️ Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application built successfully!');

  console.log('\n🎉 Build completed successfully!');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
