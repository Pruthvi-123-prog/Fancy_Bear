# Audit Tools Backend Server

Express.js backend for the security audit tools MERN application.

## Structure

```
server/
├── server.js              # Main server file
├── package.json           # Server dependencies
├── routes/
│   └── scan.js            # Scan-related routes
└── controllers/
    └── scanController.js  # Scan logic controllers
```

## API Endpoints

### POST `/api/scan`
Triggers a security scan for a given URL.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "message": "Scan initiated successfully",
  "scanId": 1,
  "status": "in_progress",
  "url": "https://example.com"
}
```

### GET `/api/report/:id`
Fetches scan report by scan ID.

**Response:**
```json
{
  "scanId": 1,
  "url": "https://example.com",
  "status": "completed",
  "startTime": "2025-08-21T11:30:00.000Z",
  "endTime": "2025-08-21T11:31:00.000Z",
  "result": {
    "security_score": 85,
    "vulnerabilities": { ... },
    "checks": { ... }
  },
  "error": null
}
```

### GET `/api/reports`
Gets all scan reports (debugging endpoint).

## Setup

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

4. Server will run on `http://localhost:5000`

## Integration

The backend connects to the `/scanner/runScan()` function and returns JSON responses directly to the frontend. The scan results are stored in memory (replace with database in production).

## Status Codes

- `202` - Scan initiated successfully
- `400` - Bad request (invalid URL or parameters)
- `404` - Scan not found
- `500` - Internal server error
