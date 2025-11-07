# Configuration Organization

This directory contains all configuration files organized by purpose for better maintainability.

## Directory Structure

```
config/
├── deploy/           # Deployment configurations
│   ├── railway.json              # Railway deployment config (root)
│   ├── backend-railway.json      # Railway config for backend service
│   ├── ml-model-railway.json     # Railway config for ML service
│   └── vercel.json               # Vercel deployment config
├── docker/           # Docker configurations
│   ├── docker-compose.yml        # Main Docker Compose setup
│   ├── Dockerfile.frontend       # Frontend Docker build
│   └── nginx.conf                # Nginx configuration
├── environments/    # Environment variables
│   └── .env                      # Docker environment variables
└── README.md         # This file
```

## Usage

### Local Development
```bash
# Use the organized Docker setup
./deploy.sh local

# Or manually
docker-compose -f config/docker/docker-compose.yml up --build -d
```

### Deployment
- **Railway**: Uses configs in `config/deploy/`
- **Vercel**: Uses `config/deploy/vercel.json`
- **Docker**: Uses `config/docker/` files

## Security Notes

- Environment files contain sensitive data - never commit them
- Railway configs use environment variable references (`${VAR_NAME}`)
- All sensitive data is encrypted and stored securely

## Migration from Old Structure

Old files have been moved to maintain compatibility:
- `docker-compose.yml` → `config/docker/docker-compose.yml`
- `nginx.conf` → `config/docker/nginx.conf`
- `Dockerfile.frontend` → `config/docker/Dockerfile.frontend`
- `.env` → `config/environments/.env`
- `railway.json` files → `config/deploy/` (renamed to avoid conflicts)
