#!/bin/bash

# Health Check Script for Mission Exploit 2.0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Mission Exploit 2.0 - Health Check"
echo "=========================================="
echo ""

# Check Backend
echo -n "Backend (http://localhost:5000): "
if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Check Frontend
echo -n "Frontend (http://localhost): "
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Check Firebase Connection
echo -n "Firebase Connection: "
if curl -sf https://firestore.googleapis.com > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Reachable${NC}"
else
    echo -e "${RED}✗ Unreachable${NC}"
fi

# Docker Status
echo ""
echo "Docker Containers:"
docker-compose ps

echo ""
echo "=========================================="

