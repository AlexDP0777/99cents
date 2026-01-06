# Server Requirements for 99cents

## System Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | >= 18 (recommended 20+) | Required for Next.js 16 |
| npm | >= 9 | Comes with Node.js |
| PM2 | latest | Process manager |
| PostgreSQL | >= 14 | Database |
| RAM | >= 2GB | For build process (Turbopack) |

## Installation Steps

### 1. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # should show v20.x.x
npm -v   # should show 10.x.x
```

### 2. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Create Database
```bash
sudo -u postgres psql
```

```sql
CREATE USER cents99 WITH PASSWORD 'your_secure_password';
CREATE DATABASE cents99 OWNER cents99;
GRANT ALL PRIVILEGES ON DATABASE cents99 TO cents99;
\q
```

### 4. Install PM2
```bash
sudo npm install -g pm2
```

### 5. Configure Environment

Create `.env` file in project root:
```bash
DATABASE_URL="postgresql://cents99:your_secure_password@localhost:5432/cents99"
```

### 6. Deploy Project
```bash
cd /path/to/99cents

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Build the project
npm run build

# Start with PM2
pm2 start npm --name "99cents" -- start

# Save PM2 config
pm2 save
pm2 startup
```

## If Build Runs Out of Memory

Add swap file:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Or limit Node.js memory during build:
```bash
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NODE_ENV | No | Set to "production" for prod |

## Useful Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs 99cents

# Restart app
pm2 restart 99cents

# Check PostgreSQL connection
psql -U cents99 -d cents99 -h localhost
```

## Troubleshooting

### "next: not found"
- Run `npm ci` to install dependencies
- Check that `node_modules/.bin` exists

### Prisma connection errors
- Verify DATABASE_URL is set correctly
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Test connection: `psql $DATABASE_URL`

### Build out of memory
- Add swap file (see above)
- Or use `NODE_OPTIONS="--max-old-space-size=1536"`
