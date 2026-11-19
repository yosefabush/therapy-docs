interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
  /** HTTP status; 0 when the request never completed (aborted / network). */
  status?: number;
}

// Never throws: aborted or failed requests and non-2xx responses come back as
// `{ error, status }` so callers can tell a real 401 from a transient failure.
async function request<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return { error: aborted ? 'Request aborted' : 'Network error', status: 0 };
  }

  let body: ApiResponse<T> = {};
  try {
    body = await response.json();
  } catch {
    // Empty or non-JSON body.
  }

  if (!response.ok) {
    return { ...body, error: body.error ?? `Request failed (${response.status})`, status: response.status };
  }
  return { ...body, status: response.status };
}

class ApiClient {
  private baseUrl = '/api';

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(`${this.baseUrl}${endpoint}`);
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return request<T>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return request<T>(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<ApiResponse<{ success: boolean }>> {
    return request<{ success: boolean }>(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
