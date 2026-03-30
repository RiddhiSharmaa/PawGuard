import { proxyToBackend } from '../_utils'

export async function POST(request: Request) {
  const payload = await request.text()
  return proxyToBackend('/sos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  })
}
