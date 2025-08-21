#!/bin/bash

echo "🚀 Setting up Aarambh Website..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Aarambh Website Environment Variables
NEXT_PUBLIC_APP_NAME=Aarambh
NEXT_PUBLIC_APP_DESCRIPTION=Learn English and Soft Skills
NEXT_PUBLIC_CONTACT_EMAIL=contact@aarambh.com
NEXT_PUBLIC_PHONE=+91 98765 43210
EOF
    echo "✅ .env.local created"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "🌐 Open http://localhost:3000 to view the website" 