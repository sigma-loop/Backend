#!/bin/bash
# Judge0 Docker Compose Startup Script

echo "Starting Judge0 services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env.judge0 ]; then
    echo "Creating .env.judge0 file..."
    cat > .env.judge0 << EOF
# Judge0 Environment Variables
POSTGRES_PASSWORD=judge0password
REDIS_PASSWORD=judge0redispassword
EOF
    echo "Created .env.judge0 with default passwords. Please change them in production!"
fi

# Load environment variables
export $(grep -v '^#' .env.judge0 | xargs)

# Start services
echo "Starting Judge0 with Docker Compose..."
sudo docker compose -f docker-compose.judge0.yml up -d

# Wait for services to be healthy
echo "Waiting for Judge0 to be ready..."
sleep 90

# Test the setup
echo "Testing Judge0 connection..."
curl -s http://localhost:2358/about || echo "Judge0 is not responding yet. Waiting a bit longer..."
sleep 10
curl -s http://localhost:2358/about && echo "✓ Judge0 is running!" || echo "✗ Judge0 failed to start"

echo ""
echo "Judge0 Dashboard: http://localhost:2358"
echo "API Endpoint: http://localhost:2358/submissions"
echo ""
echo "To stop Judge0: docker compose -f docker-compose.judge0.yml down"