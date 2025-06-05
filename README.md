# K6 Load Testing Suite

![k6](https://img.shields.io/badge/tool-k6-blue)
![status](https://img.shields.io/badge/status-active-brightgreen)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

This project contains a comprehensive load testing suite built with k6 for testing Chairsyde API endpoints and user flows.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Test Scenarios](#test-scenarios)
- [Metrics Tracked](#metrics-tracked)
- [Running the Tests](#running-the-tests)
- [Test Execution Options](#test-execution-options)
- [Test Reports](#test-reports)
- [InfluxDB and Grafana Integration](#influxdb-and-grafana-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Support](#support)
- [Notes](#notes)

---

## Overview

The test suite simulates multiple virtual users performing a sequence of actions including:

- User authentication
- Page loads (Login, Landing, Voice Note pages)
- Education content access
- Voice note creation and upload
- Video playback tracking

---

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) installed on your system
- Node.js (for any additional tooling)
- Access to the target environment (`demo` or `dev`)

---

## Project Structure

```
Load Test/
├── Demo.js           → Main test script
├── README.md         → Project overview and instructions
├── users.csv         → Test user credentials
└── chunk/            → WebM audio chunks for upload testing
    └── chunk*.webm
```

---

## Configuration

Edit the top of `Demo.js` to configure your test environment:

```javascript
const ENV = 'demo';            // 'demo' or 'dev' (target environment)
const VU_COUNT = 100;          // Number of virtual users
const TEST_ID = '100vus_test'; // Identifier used for tagging test metrics
```

### Environment URLs

- Demo: `https://demo-v3-api.chairsyde.com`
- Dev: `https://dev-v3-api.chairsyde.com`

---

## Test Scenarios

Test flow overview:

1. **Authentication Flow**
   - CSRF token acquisition
   - User login
   - User data retrieval
   - Broadcasting authentication

2. **Page Load Tests**
   - Login page
   - Landing page
   - Voice note page
   - Resource loading

3. **Education Content**
   - Conditions data
   - Treatment categories
   - Risk categories
   - Playlist data

4. **Voice Note Creation**
   - Session creation
   - Chunked voice note upload
   - S3 upload handling
   - Transcription
   - Title generation

5. **Video Playback**
   - Page load
   - Content view tracking
   - Video playback tracking

---

## Metrics Tracked

The suite tracks:

- HTTP request metrics
- Custom timing metrics (e.g., `auth_duration`, `upload_chunk_time`)
- Page and resource load durations
- API success/failure rates
- Upload performance breakdown
- Response time distributions

---

## Running the Tests

### 1. Prepare test users

Make sure `users.csv` contains valid credentials for the selected environment:

```csv
email,password
user1@example.com,password1
user2@example.com,password2
```

> ⚠️ Invalid credentials will cause authentication failures.

### 2. Prepare voice note chunks

Place audio files in `chunk/` directory:

```
chunk/
├── chunk0.webm
├── chunk1.webm
└── ...
```

### 3. Run the test

```bash
k6 run Demo.js
```

---

## Test Execution Options

Customize how the test runs using the following options:

```bash
# Run with a specific number of virtual users
k6 run -u 50 Demo.js

# Run for a set duration
k6 run --duration 30m Demo.js

# Run with both options
k6 run -u 50 --duration 30m Demo.js
```

---

## Test Reports

The test suite produces:

- `summary.html` → Visual report with charts
- `summary.json` → Raw JSON test results
- `failures.txt` → Breakdown of failed requests and error types

### Key Metrics in Reports

- Total test duration
- Number of virtual users
- API success/failure counts
- Average request duration per endpoint
- Upload & playback performance
- HTTP metrics by status code
- Custom tags (e.g., `test_id`, `user_id`)

---

## InfluxDB and Grafana Integration

To send test metrics to InfluxDB Cloud for visualization in Grafana, set up the required environment variables and use the xk6-influxdb output:

### Environment Setup

```powershell
# Set InfluxDB Cloud configuration
$env:K6_INFLUXDB_TOKEN = "your_influxdb_token"
$env:K6_INFLUXDB_ORGANIZATION = "your_org_id"
$env:K6_INFLUXDB_BUCKET = "your_bucket_name"
$env:K6_INFLUXDB_ADDR = "your_influxdb_cloud_url"
$env:K6_INFLUXDB_PUSH_INTERVAL = "30s"
```

### Running with InfluxDB Output

```powershell
.\k6.exe run --out xk6-influxdb Demo.js
```

### Configuration Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `K6_INFLUXDB_TOKEN` | Authentication token for InfluxDB Cloud | `abcd1234...` |
| `K6_INFLUXDB_ORGANIZATION` | Your InfluxDB organization ID | `org_id_12345` |
| `K6_INFLUXDB_BUCKET` | Target bucket for storing metrics | `k6_metrics` |
| `K6_INFLUXDB_ADDR` | InfluxDB Cloud API endpoint | `https://your-region.aws.cloud2.influxdata.com` |
| `K6_INFLUXDB_PUSH_INTERVAL` | How often to push metrics (default: 30s) | `30s` |

### Benefits

- Real-time metrics visualization
- Long-term trend analysis
- Custom dashboards and alerts
- Cross-test comparison
- Team collaboration on results

> Note: Ensure your InfluxDB Cloud credentials are kept secure and not committed to version control.

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **Auth Failures** | Invalid users or bad CSRF handling | Check `users.csv`, review token logic |
| **Upload Errors** | Missing/invalid chunk files | Ensure files are in `chunk/`, validate WebM format |
| **S3 Issues** | Permission or key issues | Verify S3 credentials and bucket permissions |
| **Slow Tests** | Resource exhaustion or environment bottlenecks | Lower VU count, check system and network usage |

---

## Best Practices

1. Start with low VUs to validate test behavior
2. Scale up gradually to identify system limits
3. Monitor server CPU/memory/network during test
4. Analyze failures with `failures.txt`
5. Tag each run with a unique `TEST_ID` for Grafana tracking
6. Keep test data (users, chunks) in sync with environment changes

---

## Support

If you encounter issues:

1. Review [k6 Documentation](https://k6.io/docs/)
2. Check the `failures.txt` file for insights
3. Monitor logs from the backend during the test run

---

## Notes

- Includes **think time and sleep** to mimic realistic user behavior
- 15% of virtual users perform **mid-upload integrity checks**
- All metrics are tagged with `test_id` for filtering and dashboards for Grafana
- Failed requests are logged and analyzed post-test


