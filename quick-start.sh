#!/bin/bash

echo "🚀 Starting Podo App Setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.docker .env
    echo "✅ Environment file created. Edit .env if needed."
fi

# Ask user for deployment type
echo "Choose deployment type:"
echo "1) Development (with hot reloading)"
echo "2) Production"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "🔧 Starting in development mode..."
        docker-compose -f docker-compose.dev.yml up --build -d
        echo "✅ Development server started!"
        echo "🌐 Frontend: http://localhost:5173"
        echo "🔌 Backend API: http://localhost:3001"
        ;;
    2)
        echo "🏭 Starting in production mode..."
        docker-compose up --build -d
        echo "✅ Production server started!"
        echo "🌐 Frontend: http://localhost"
        echo "🔌 Backend API: http://localhost:3001"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart" 