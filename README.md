# WTP Property Market Watchlist

Managed deployment target: Render Web Service.

## Local run
```bash
npm install
npm run dev
```
Open: http://localhost:8787
API: http://localhost:8787/api/market/areas

## Deploy to Render
1. Create a new GitHub repo and upload these files.
2. Render → New → Web Service → connect repo.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Health Check Path: `/health`

The frontend uses relative API path `/api/market/areas`, so it works after deployment without editing localhost URLs.

## Notes
- The API bridge tries Dubai Pulse / DLD public endpoints.
- If the endpoint is unavailable, blocked, or returns an unexpected format, the app falls back to mock data and shows `source: mock-fallback` in the API response.
- Add or override `DLD_SALES_URL` and `DLD_RENTS_URL` in Render environment variables if you get the final official endpoint or Property Monitor endpoint.
