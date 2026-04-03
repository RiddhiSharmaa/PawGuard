const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  process.env.BACKEND_API_BASE_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://127.0.0.1:8000'

const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_WAKE_TIMEOUT_MS = 90000
const HEALTH_CHECK_INTERVAL_MS = 3000

async function fetchWithTimeout(
  path: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForBackendReady(timeoutMs: number = DEFAULT_WAKE_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs
  let lastError: Error | null = null

  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout('/health', undefined, Math.min(15000, timeoutMs))
      if (response.ok) {
        return
      }

      lastError = new Error(`Health check failed with status ${response.status}.`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Backend wake-up failed.')
    }

    const remainingMs = deadline - Date.now()
    if (remainingMs > 0) {
      await sleep(Math.min(HEALTH_CHECK_INTERVAL_MS, remainingMs))
    }
  }

  throw lastError ?? new Error('Backend did not become ready in time.')
}

export async function proxyToBackend(
  path: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  try {
    const isFormData = init?.body instanceof FormData
    const headers = isFormData
      ? init?.headers
      : {
          ...init?.headers,
          'Content-Type': 'application/json',
        }

    await waitForBackendReady()

    const response = await fetchWithTimeout(path, {
      method: init?.method || 'GET',
      body: init?.body,
      headers,
    }, timeoutMs)

    const body = await response.text()

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    const detail =
      error instanceof Error && error.name === 'AbortError'
        ? `Timed out while contacting backend endpoint ${path} at ${API_URL}.`
        : `Backend is waking up or unavailable at ${API_URL}. Please try again in a moment.`

    return Response.json({ detail }, { status: 502 })
  }
}
