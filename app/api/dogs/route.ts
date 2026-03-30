import { proxyToBackend } from '../_utils'

export async function GET() {
  return proxyToBackend('/dogs')
}
