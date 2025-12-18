#!/bin/bash

# Mission Exploit 2.0 - Deployment Script
# This script deploys both frontend and backend

set -e

echo "=========================================="
echo "Mission Exploit 2.0 - Deployment Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Check environment files
echo -e "${YELLOW}Checking environment files...${NC}"

if [ ! -f "./backend/.env" ]; then
    echo -e "${RED}Error: backend/.env file not found${NC}"
    echo "Please create backend/.env from backend/.env.example"
    exit 1
fi

if [ ! -f "./.env.production" ]; then
    echo -e "${YELLOW}Warning: .env.production not found, using .env${NC}"
fi

echo -e "${GREEN}✓ Environment files found${NC}"
echo ""

# Build and deploy
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

echo -e "${GREEN}✓ Services started successfully${NC}"
echo ""

# Check health
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check backend health
if curl -f http://localhost:5000/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

# Check frontend health
if curl -f http://localhost/health &> /dev/null; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Frontend: http://localhost"
echo "  - Backend:  http://localhost:5000"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""

