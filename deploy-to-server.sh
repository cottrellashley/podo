#!/bin/bash

set -e  # Exit on any error

echo "🚀 Podo App - Complete Linux Server Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_status "Starting deployment on $(hostname)..."

# 1. Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# 2. Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install prerequisites
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi

# 3. Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed"
fi

# 4. Install Git and Node (for any local operations)
print_status "Installing Git and Node.js..."
apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 5. Create application directory
APP_DIR="/opt/podo"
print_status "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# 6. Create minimal Docker setup
print_status "Creating Docker configuration files..."

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    container_name: podo-database
    restart: unless-stopped
    environment:
      POSTGRES_DB: podo
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - podo-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d podo"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: podo-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@database:5432/podo?sslmode=disable
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
      CORS_ORIGINS: http://localhost,http://nginx
    depends_on:
      database:
        condition: service_healthy
    networks:
      - podo-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: /api
    container_name: podo-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - podo-network

volumes:
  postgres_data:

networks:
  podo-network:
    driver: bridge
EOF

# Create .env file with secure defaults
print_status "Creating environment configuration..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

cat > .env << EOF
# Database Configuration
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET

# Environment
NODE_ENV=production
EOF

print_success "Generated secure passwords and JWT secret"

# Create database initialization script
cat > init.sql << 'EOF'
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS podo;

-- Create basic tables (you may need to adjust based on your schema)
\c podo;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add other tables as needed for your application
-- This is a basic setup - adjust according to your actual schema
EOF

# Create simple Dockerfile for backend
mkdir -p server
cat > server/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
EOF

# Create simple Dockerfile for frontend
cat > Dockerfile.frontend << 'EOF'
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx configuration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    server {
        listen 80;
        server_name _;
        
        # Serve frontend
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
        
        # Proxy API requests to backend
        location /api/ {
            proxy_pass http://backend:3001/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# 7. Setup firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
print_success "Firewall configured"

# 8. Create management scripts
print_status "Creating management scripts..."

# Start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Podo application..."
docker-compose up -d --build
echo "Application started! Visit http://$(curl -s ifconfig.me) to access it."
echo "To view logs: docker-compose logs -f"
EOF

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "Stopping Podo application..."
docker-compose down
echo "Application stopped."
EOF

# Update script
cat > update.sh << 'EOF'
#!/bin/bash
echo "Updating Podo application..."
git pull
docker-compose down
docker-compose up -d --build
echo "Application updated and restarted!"
EOF

# Status script
cat > status.sh << 'EOF'
#!/bin/bash
echo "Podo Application Status:"
echo "======================="
docker-compose ps
echo ""
echo "Logs (last 20 lines):"
echo "===================="
docker-compose logs --tail=20
EOF

chmod +x *.sh

print_success "Management scripts created"

# 9. Display next steps
print_success "Deployment setup complete!"
echo ""
echo "📁 Application installed in: $APP_DIR"
echo "🔐 Database password: $DB_PASSWORD"
echo "🔑 JWT Secret: $JWT_SECRET"
echo ""
echo "📋 Next steps:"
echo "1. Copy your application source code to this directory"
echo "2. Ensure your package.json and source files are in place"
echo "3. Run: ./start.sh"
echo ""
echo "🛠️  Management commands:"
echo "   ./start.sh   - Start the application"
echo "   ./stop.sh    - Stop the application"
echo "   ./status.sh  - Check application status"
echo "   ./update.sh  - Update and restart (after git pull)"
echo ""
echo "🌐 Your app will be available at: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
print_warning "Remember to:"
print_warning "- Copy your actual source code to $APP_DIR"
print_warning "- Update the database schema in init.sql if needed"
print_warning "- Configure your domain name and SSL certificates for production"

echo ""
print_success "Deployment script completed successfully! 🎉" 