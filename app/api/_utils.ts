const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://127.0.0.1:8000'

const DEFAULT_TIMEOUT_MS = 30000

export async function proxyToBackend(
  path: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    })

    const body = await response.text()

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    const detail =
      error instanceof Error && error.name === 'AbortError'
        ? `Timed out while contacting backend endpoint ${path}.`
        : `Unable to reach backend endpoint ${path}.`

    return Response.json({ detail }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}
