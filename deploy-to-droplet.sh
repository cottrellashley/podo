#!/bin/bash

echo "🚀 Deploying Podo to DigitalOcean Droplet..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Start Docker
systemctl start docker
systemctl enable docker

# Clone or update repository
if [ -d "podo" ]; then
    echo "📥 Updating existing repository..."
    cd podo
    git pull
else
    echo "📥 Cloning repository..."
    git clone https://github.com/your-username/podo.git
    cd podo
fi

# Generate secure passwords
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
SERVER_IP=$(curl -s ifconfig.me)

# Create production environment file
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
DB_NAME=podo
DB_USER=postgres
DB_PASSWORD=$DB_PASS
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
VITE_API_URL=/api
CORS_ORIGINS=http://$SERVER_IP,https://$SERVER_IP
PORT=80
EOF

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow ssh
ufw --force enable

# Deploy application
echo "🚀 Starting application..."
docker-compose down 2>/dev/null || true
docker-compose up --build -d

# Show status
echo "✅ Deployment complete!"
echo "🌐 Your app is live at: http://$SERVER_IP"
echo "🔐 Database password: $DB_PASS"
echo "🔑 JWT Secret: $JWT_SECRET"
echo "📊 Container status:"
docker-compose ps 