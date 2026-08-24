export type ApiFailureKind =
  | 'timeout'
  | 'network'
  | 'rate-limited'
  | 'server'
  | 'invalid-response'
  | 'no-data'

export class ApiError extends Error {
  readonly kind: ApiFailureKind

  constructor(kind: ApiFailureKind, message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

export function isAbortLike(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  )
}

interface RequestOptions {
  timeoutMs?: number
  signal?: AbortSignal
}

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 12000, signal: externalSignal } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  const handleExternalAbort = () => controller.abort()
  if (externalSignal) {
    if (externalSignal.aborted) {
      window.clearTimeout(timer)
      throw new DOMException('Request aborted', 'AbortError')
    }
    externalSignal.addEventListener('abort', handleExternalAbort)
  }

  try {
    let response: Response
    try {
      response = await fetch(url, { signal: controller.signal })
    } catch (error) {
      if (isAbortLike(error)) {
        if (externalSignal?.aborted) throw error
        throw new ApiError('timeout', 'The request timed out.')
      }
      throw new ApiError('network', 'Network error — check your connection.')
    }

    if (response.status === 429) {
      throw new ApiError(
        'rate-limited',
        'Rate limit reached — please wait a moment before retrying.',
      )
    }
    if (!response.ok) {
      throw new ApiError('server', `Service error (HTTP ${response.status}).`)
    }

    try {
      return (await response.json()) as T
    } catch {
      throw new ApiError('invalid-response', 'Service returned an unreadable response.')
    }
  } finally {
    window.clearTimeout(timer)
    externalSignal?.removeEventListener('abort', handleExternalAbort)
  }
}

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}
