# Texas Hold'em Tracker Deployment Checklist

This guide is tailored for deploying the `Texas_holdem` service to **kihyunpc-server**.
Reference the original "Final Check Guide" for the core philosophy.

## 1. Source Code & GitHub (Ready)
- [x] **`.gitignore`**: Verified. Includes `.env`, `__pycache__`, `*.db`.
- [x] **`Dockerfile`**: Verified. Uses `python:3.9-slim` and `EXPOSE 5000`.
- [x] **`docker-compose.yml`**: Updated.
    - `npm_default` network added.
    - Ports commented out (security).
    - Volume path comments added.

## 2. Server Environment Prep (SSH Required)
Run these commands on the server:

```bash
# 1. Create Service Directory
sudo mkdir -p /mnt/data1TB/services/texas_holdem
cd /mnt/data1TB/services/texas_holdem

# 2. Setup Data Directory (2TB Storage)
sudo mkdir -p /mnt/data2TB/texas_holdem_data
sudo chown -R 1000:1000 /mnt/data2TB/texas_holdem_data
```

## 3. Deployment Steps
1. **Clone/Pull Repository**:
   ```bash
   git clone <repo_url> .
   # OR if already exists
   git pull
   ```

2. **Configure Environment**:
   ```bash
   # Create .env manually (do not commit to git)
   sudo vim .env
   ```
   **Required `.env` content:**
   ```env
   OPENAI_API_KEY=sk-...
   DATABASE_PATH=/app/data/poker.db
   ```

3. **Start Service**:
   ```bash
   sudo docker compose up -d --build
   ```

## 4. Nginx Proxy Manager (NPM) Configuration
- **URL**: http://172.30.1.200:81
- **Add Proxy Host**:
    - **Domain Names**: (e.g., `poker.kihyun.com`)
    - **Scheme**: `http`
    - **Forward Hostname**: `texas_holdem_tracker`
    - **Forward Port**: `5000`
    - **Block Common Exploits**: [x]
    - **Websockets Support**: [x] (Optional but recommended)
    - **SSL**: Request Let's Encrypt certificate + Force SSL.

## 5. Post-Deployment Verification
- Check logs: `sudo docker compose logs -f`
- Verify data persistence: Ensure `poker.db` appears in `/mnt/data2TB/texas_holdem_data`.
