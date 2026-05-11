# myth-delivery-web — Docker steps (web only)

Build and run the **Next.js UI** by itself. It must know where the **API** lives via **`NEXT_PUBLIC_API_URL`** (and **`NEXT_PUBLIC_WS_URL`** for SignalR) **at build time**.

---

## What you need

- Docker Desktop **or** Docker Engine  
- The **API base URL** the browser will call (examples below)

---

## Step 1 — Open a terminal at the web repo root

Example:

```powershell
cd E:\Develop\WebAPIs\myth-delivery-web
```

---

## Step 2 — Build the image (set API URL here)

**API on same PC, default Docker API port:**

```powershell
docker build `
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 `
  --build-arg NEXT_PUBLIC_WS_URL=http://localhost:8080 `
  -t mythdelivery-web:latest .
```

**API on another machine or public URL:**

```powershell
docker build `
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com `
  --build-arg NEXT_PUBLIC_WS_URL=https://api.yourdomain.com `
  -t mythdelivery-web:latest .
```

**Important:** These values are **baked into** the client bundle. If the API URL changes, **rebuild** the image.

---

## Step 3 — Run the web container

```powershell
docker run -d --name mythdelivery-web -p 3000:3000 mythdelivery-web:latest
```

- **`-p 3000:3000`** — open http://localhost:3000  

Logs:

```powershell
docker logs -f mythdelivery-web
```

---

## Step 4 — Verify

1. Open http://localhost:3000  
2. Try login — browser calls **`NEXT_PUBLIC_API_URL`** you used at build time.  
3. If you see **CORS** errors, fix them on the **API** (`Cors__ExtraOrigins` must include your web origin, e.g. `http://localhost:3000` or `https://app.yourdomain.com`).

---

## Stop / remove / update

```powershell
docker stop mythdelivery-web
docker rm mythdelivery-web
```

After code changes: **Step 2** again, then **Step 3** with the new image.

---

## Files involved (web repo)

| Path | Purpose |
|------|---------|
| `Dockerfile` | Production standalone Next.js image |
| `.dockerignore` | Build context trim |
| `next.config.ts` | `output: "standalone"` |

---

## Tips

- **LAN testing:** If you open the site as `http://192.168.x.x:3000`, the API URL in the bundle must be reachable from **that device’s browser** (often `http://192.168.x.x:8080`), and CORS on the API must allow `http://192.168.x.x:3000`.  
- **HTTPS:** Prefer `https://` API URL when TLS terminates on your reverse proxy.
