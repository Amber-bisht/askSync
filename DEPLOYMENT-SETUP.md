# Deployment Setup Checklist

## GitHub Secrets

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

## SSH Setup

14. SSH password: `DO_SSH_PASSWORD` = `__`
15. Test SSH: `ssh root@__` (enter password when prompted)

## Docker Setup

16. Docker installed on VPS: `docker --version` = `__`
17. Docker login: `docker login ghcr.io -u __`
18. Container name: `asksync-app`
19. Port mapping: `5000:5000`

## VPS Configuration

20. VPS IP/Domain: `__`
21. Firewall port 5000: `ufw allow 5000/tcp`
22. Domain DNS A record: `__` → `__`

## Git Configuration

23. Repository: `github.com/__/__`
24. Branch: `main` or `master`
25. Push triggers deployment: `git push origin main`
