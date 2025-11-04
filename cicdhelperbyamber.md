# Deployment Setup Checklist

## GitHub Secrets

**Since your workflow uses `environment: production`, add secrets here:**

1. First, create the environment (if not exists):
   - Go to: `Settings → Environments → New environment`
   - Name: `production`
   - Click "Configure environment"

2. Then add secrets to the production environment:
   - Go to: `Settings → Environments → production → Add secret`
   - URL: https://github.com/Amber-bisht/askSync/settings/environments

Add these secrets to the **production environment**:

1. `DO_SSH_PASSWORD` = `__`
2. `DO_HOST` = `__`
3. `DO_USER` = `__` (default: root)
4. `DEPLOYMENT_URL` = `__`
5. `MONGODB_URI` = `__`
6. `GOOGLE_GEMINI_API_KEY` = `__`
7. `NEXTAUTH_SECRET` = `__`
8. `NEXTAUTH_URL` = `__`
9. `GOOGLE_CLIENT_ID` = `__`
10. `GOOGLE_CLIENT_SECRET` = `__`
11. `GOOGLE_CALLBACK_URL` = `__`
12. `RAZORPAY_KEY_ID` = `__`
13. `RAZORPAY_KEY_SECRET` = `__`
14. `DOCKERHUB_TOKEN` = `__` (Docker Hub Personal Access Token)

## SSH Setup

14. SSH password: `DO_SSH_PASSWORD` = `__`
15. Test SSH: `ssh root@__` (enter password when prompted)

## Docker Setup

16. Docker installed on VPS: `docker --version` = `__`
17. Docker Hub login: `docker login -u amberbisht`
18. Container name: `asksync-app`
19. Port mapping: `5000:5000`
20. Docker image: `amberbisht/asksync:latest`

## VPS Configuration

20. VPS IP/Domain: `__`
21. Firewall port 5000: `ufw allow 5000/tcp`
22. Domain DNS A record: `__` → `__`

## Git Configuration

23. Repository: `github.com/Amber-bisht/askSync`
24. Branch: `main` or `master`
25. Push triggers deployment: `git push origin main`

## Rollback Process

### Automatic Rollback
- If deployment fails, the system automatically rolls back to the previous backup image
- Backup images are created before each deployment
- Last 5 backups are kept automatically

### Manual Rollback
1. Go to: `Actions → CI/CD Pipeline → Run workflow`
2. Select branch: `main` or `master`
3. Optional: Enter specific backup tag (e.g., `backup-20250105-123000`)
4. Click "Run workflow"
5. The rollback job will restore the previous version

### Manual Rollback via SSH
```bash
# SSH into VPS
ssh root@ip

# List available backups
docker images amberbisht/asksync | grep backup

# Rollback to specific backup
docker stop asksync-app
docker rm asksync-app
docker run -d --name asksync-app --restart unless-stopped -p 5000:5000 [env vars] amberbisht/asksync:backup-20250105-123000
```
