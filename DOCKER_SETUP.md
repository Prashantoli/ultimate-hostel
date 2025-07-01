# 🐳 Docker Setup for Nepal Hostel Finder

This guide will help you run the Nepal Hostel Finder application using Docker containers.

## 📋 Prerequisites

Make sure you have installed:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🚀 Quick Start

### 1. Clone and Navigate
\`\`\`bash
git clone <your-repo-url>
cd hostel-recommendation-system
\`\`\`

### 2. Build and Run with Docker Compose
\`\`\`bash
# Build and start all services (app + database)
docker-compose up --build

# Or run in background (detached mode)
docker-compose up -d --build
\`\`\`

### 3. Setup Database (First Time Only)
\`\`\`bash
# Wait for containers to start, then setup the database
docker-compose exec app npm run setup
\`\`\`

### 4. Access the Application
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

## 🔐 Default Login Credentials

- **Admin**: `admin@nepalhostel.com` / `admin123`
- **User**: `user@nepalhostel.com` / `user123`

## 📊 What's Running?

- **App Container**: Nepal Hostel Finder (Port 3000)
- **MongoDB Container**: Database (Port 27017)

## 🛠️ Useful Docker Commands

### View Running Containers
\`\`\`bash
docker-compose ps
\`\`\`

### View Logs
\`\`\`bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs mongodb
\`\`\`

### Stop Services
\`\`\`bash
docker-compose down
\`\`\`

### Stop and Remove Everything (including data)
\`\`\`bash
docker-compose down -v
\`\`\`

### Restart Services
\`\`\`bash
docker-compose restart
\`\`\`

### Access App Container Shell
\`\`\`bash
docker-compose exec app sh
\`\`\`

### Access MongoDB Shell
\`\`\`bash
docker-compose exec mongodb mongosh nepal_hostel_finder
\`\`\`

## 🔧 Development Mode

For development with auto-reload:

\`\`\`bash
# Modify docker-compose.yml to use npm run dev
docker-compose up --build
\`\`\`

## 📁 Data Persistence

- MongoDB data is stored in a Docker volume `mongodb_data`
- Data persists even when containers are stopped
- To completely reset: `docker-compose down -v`

## 🌐 Environment Variables

You can modify these in `docker-compose.yml`:

- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: Secret key for authentication
- `NODE_ENV`: Environment mode

## 🐛 Troubleshooting

### Port Already in Use
\`\`\`bash
# Check what's using port 3000
lsof -i :3000

# Or use different ports in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
\`\`\`

### Database Connection Issues
\`\`\`bash
# Check if MongoDB is running
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
\`\`\`

### App Won't Start
\`\`\`bash
# Check app logs
docker-compose logs app

# Rebuild containers
docker-compose up --build --force-recreate
\`\`\`

## 📦 Production Deployment

For production, consider:

1. Use environment-specific `.env` files
2. Set up proper MongoDB authentication
3. Use a reverse proxy (nginx)
4. Enable SSL/HTTPS
5. Set up monitoring and logging

## 🎯 Next Steps

1. **Customize**: Modify the application as needed
2. **Scale**: Use Docker Swarm or Kubernetes for scaling
3. **Monitor**: Add logging and monitoring solutions
4. **Backup**: Set up database backup strategies
