# Local Dev Mode

## Backend

The API now supports a local mock mode using [apps/api/.env](C:/buildstartup/apps/api/.env):

- `USE_MOCK_SERVICES=true`
- `USE_IN_MEMORY_DB=true`
- no Firebase, Google Maps, Razorpay, Cloudinary, or MongoDB Atlas keys are required for local startup

## Mock Tokens

Use these bearer tokens against authenticated endpoints:

- `Bearer dev-admin`
- `Bearer dev-driver`
- `Bearer dev-customer`

Example:

```powershell
Invoke-WebRequest -UseBasicParsing -Headers @{ Authorization = 'Bearer dev-admin' } http://127.0.0.1:4000/v1/me
```

## Current Local API

- health: `http://127.0.0.1:4000/health`
- authenticated sample: `http://127.0.0.1:4000/v1/me`

## PATH Note

Node was added to the user PATH, but existing terminals need to be restarted to pick up the change.
