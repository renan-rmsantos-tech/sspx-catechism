export interface ApiFetchOptions extends RequestInit {
  json?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export class ApiUnauthorizedError extends ApiError {
  constructor(message = 'sessão expirada', payload: unknown = null) {
    super(401, message, payload)
    this.name = 'ApiUnauthorizedError'
  }
}

function isJsonResponse(response: Response): boolean {
  return response.headers.get('content-type')?.includes('application/json') ?? false
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  if (isJsonResponse(response)) return response.json()
  const text = await response.text()
  return text || null
}

function errorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const value = (payload as { error?: unknown }).error
    if (typeof value === 'string' && value.trim()) return value
  }
  if (typeof payload === 'string' && payload.trim()) return payload
  return status === 401 ? 'sessão expirada' : 'erro ao comunicar com o servidor'
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { json, headers, ...init } = options
  const requestHeaders = new Headers(headers)
  let body = init.body

  if (json !== undefined) {
    requestHeaders.set('content-type', 'application/json')
    body = JSON.stringify(json)
  }

  const response = await fetch(path, {
    ...init,
    body,
    credentials: 'include',
    headers: requestHeaders,
  })
  const payload = await parseResponseBody(response)

  if (!response.ok) {
    const message = errorMessage(response.status, payload)
    if (response.status === 401) throw new ApiUnauthorizedError(message, payload)
    throw new ApiError(response.status, message, payload)
  }

  return payload as T
}

export function isUnauthorizedError(error: unknown): error is ApiUnauthorizedError {
  return error instanceof ApiUnauthorizedError
}
