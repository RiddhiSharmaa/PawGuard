import { proxyToBackend } from '../_utils'

export async function POST(request: Request) {
  const formData = await request.formData()
  return proxyToBackend('/report', {
    method: 'POST',
    body: formData,
  })
}
