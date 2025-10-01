#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Newsletter Automation App Setup...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'sst.config.ts',
  'tsconfig.json',
  'backend/functions/newsletter-signup.ts',
  'backend/functions/email-processor.ts',
  'lib/automation/playwright.ts',
  'lib/automation/skyvern.ts',
  'lib/automation/browserbase.ts',
  'lib/email-service.ts',
  'lib/link-extractor.ts',
  'frontend/package.json',
  'frontend/src/app/page.tsx',
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'sst',
  'aws-cdk-lib',
  'playwright',
  'openai',
  'zod',
  'uuid'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
});

// Check frontend dependencies
console.log('\n🎨 Checking frontend dependencies...');
const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
const requiredFrontendDeps = [
  'next',
  'react',
  'typescript',
  'tailwindcss',
  'lucide-react'
];

requiredFrontendDeps.forEach(dep => {
  if (frontendPackageJson.dependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
});

// Check environment file
console.log('\n🔐 Checking environment configuration...');
if (fs.existsSync('.env')) {
  console.log('✅ .env file exists');
} else if (fs.existsSync('env.example')) {
  console.log('⚠️  .env file missing, but env.example exists');
  console.log('   Copy env.example to .env and configure your API keys');
} else {
  console.log('❌ No environment configuration found');
  allFilesExist = false;
}

// Summary
console.log('\n📊 Setup Summary:');
if (allFilesExist) {
  console.log('✅ All required files and dependencies are present!');
  console.log('\n🚀 Next steps:');
  console.log('1. Copy env.example to .env and configure your API keys');
  console.log('2. Run: npm install');
  console.log('3. Run: cd frontend && npm install');
  console.log('4. Run: npm run dev');
} else {
  console.log('❌ Some files or dependencies are missing.');
  console.log('Please check the errors above and fix them.');
}

console.log('\n📚 Documentation:');
console.log('- README.md: Complete setup and usage guide');
console.log('- ARCHITECTURE.md: Detailed architecture and design choices');
console.log('- env.example: Environment variables template');

console.log('\n🎯 Framework Comparison:');
console.log('- Playwright: Fast, reliable, free (recommended for most sites)');
console.log('- Skyvern: AI-powered, handles complex forms (requires API key)');
console.log('- Browserbase: Cloud-based, scalable (requires API key)');

console.log('\n✨ Happy coding!');
