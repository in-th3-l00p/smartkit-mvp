import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const walletCreationDuration = new Trend('wallet_creation_duration', true)
const transactionDuration = new Trend('transaction_duration', true)
const dashboardDuration = new Trend('dashboard_duration', true)
const errorRate = new Rate('errors')

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api'
const API_KEY = __ENV.API_KEY || 'sk_test_load_test_key'

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_KEY}`,
}

// ---------------------------------------------------------------------------
// Scenarios
//
// Targets from the plan:
//   - wallet creation p95 < 500ms
//   - transaction p95 < 2s
//   - dashboard p95 < 200ms
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    // Ramp up to 100 concurrent users over 3 minutes, sustain for 5 min
    load_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // Global
    http_req_failed: ['rate<0.01'],        // < 1% errors
    http_req_duration: ['p(95)<3000'],     // p95 < 3s overall

    // Per-operation
    wallet_creation_duration: ['p(95)<500'],   // p95 < 500ms
    transaction_duration: ['p(95)<2000'],      // p95 < 2s
    dashboard_duration: ['p(95)<200'],         // p95 < 200ms

    errors: ['rate<0.01'],
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let walletCounter = 0

function uniqueEmail() {
  walletCounter++
  return `loadtest+${Date.now()}_${walletCounter}_${__VU}@test.com`
}

// ---------------------------------------------------------------------------
// Default function — runs for each VU iteration
// ---------------------------------------------------------------------------

export default function () {
  let walletAddress = null

  // ---- Create Wallet ----
  group('Create Wallet', () => {
    const payload = JSON.stringify({
      userId: `user_${__VU}_${__ITER}`,
      email: uniqueEmail(),
    })

    const res = http.post(`${BASE_URL}/wallets/create`, payload, { headers })

    walletCreationDuration.add(res.timings.duration)

    const success = check(res, {
      'wallet created (201 or 200)': (r) => r.status === 201 || r.status === 200,
      'wallet has address': (r) => {
        try {
          const body = JSON.parse(r.body)
          walletAddress = body.address
          return !!body.address
        } catch {
          return false
        }
      },
    })

    if (!success) errorRate.add(1)
    else errorRate.add(0)
  })

  sleep(0.5)

  // ---- Send Transaction ----
  if (walletAddress) {
    group('Send Transaction', () => {
      const payload = JSON.stringify({
        walletAddress,
        to: '0x000000000000000000000000000000000000dEaD',
        value: '0',
        data: '0x',
        sponsored: true,
      })

      const res = http.post(`${BASE_URL}/transactions/send`, payload, { headers })

      transactionDuration.add(res.timings.duration)

      const success = check(res, {
        'transaction accepted (200)': (r) => r.status === 200,
        'has userOpHash': (r) => {
          try {
            return !!JSON.parse(r.body).userOpHash
          } catch {
            return false
          }
        },
      })

      if (!success) errorRate.add(1)
      else errorRate.add(0)
    })
  }

  sleep(0.5)

  // ---- Dashboard Stats ----
  group('Dashboard Stats', () => {
    const res = http.get(`${BASE_URL}/stats`, { headers })

    dashboardDuration.add(res.timings.duration)

    const success = check(res, {
      'stats returned (200)': (r) => r.status === 200,
      'has totalWallets': (r) => {
        try {
          return JSON.parse(r.body).totalWallets !== undefined
        } catch {
          return false
        }
      },
    })

    if (!success) errorRate.add(1)
    else errorRate.add(0)
  })

  sleep(0.5)

  // ---- List Wallets ----
  group('List Wallets', () => {
    const res = http.get(`${BASE_URL}/wallets`, { headers })

    const success = check(res, {
      'wallets listed (200)': (r) => r.status === 200,
    })

    if (!success) errorRate.add(1)
    else errorRate.add(0)
  })

  sleep(0.5)

  // ---- List Transactions ----
  group('List Transactions', () => {
    const res = http.get(`${BASE_URL}/transactions`, { headers })

    const success = check(res, {
      'transactions listed (200)': (r) => r.status === 200,
    })

    if (!success) errorRate.add(1)
    else errorRate.add(0)
  })

  sleep(1)
}

// ---------------------------------------------------------------------------
// Summary handler
// ---------------------------------------------------------------------------

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    metrics: {
      http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'],
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate,
      wallet_creation_p95: data.metrics.wallet_creation_duration?.values?.['p(95)'],
      transaction_p95: data.metrics.transaction_duration?.values?.['p(95)'],
      dashboard_p95: data.metrics.dashboard_duration?.values?.['p(95)'],
      error_rate: data.metrics.errors?.values?.rate,
      total_requests: data.metrics.http_reqs?.values?.count,
      vus_max: data.metrics.vus_max?.values?.value,
    },
  }

  return {
    'scripts/load-tests/results.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function textSummary(data, opts) {
  const lines = [
    '\n=== SmartKit Load Test Results ===\n',
    `Total requests:        ${data.metrics.http_reqs?.values?.count || 'N/A'}`,
    `Peak VUs:              ${data.metrics.vus_max?.values?.value || 'N/A'}`,
    `Error rate:            ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%`,
    '',
    '--- Latency (p95) ---',
    `Wallet creation:       ${(data.metrics.wallet_creation_duration?.values?.['p(95)'] || 0).toFixed(0)}ms (target: <500ms)`,
    `Transaction send:      ${(data.metrics.transaction_duration?.values?.['p(95)'] || 0).toFixed(0)}ms (target: <2000ms)`,
    `Dashboard stats:       ${(data.metrics.dashboard_duration?.values?.['p(95)'] || 0).toFixed(0)}ms (target: <200ms)`,
    '',
  ]
  return lines.join('\n')
}
