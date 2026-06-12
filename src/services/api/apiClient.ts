import { ENV } from '@/src/utils/config/env';
import { tokenStorage } from '../auth/tokenStorage';
import { AuthResponse } from '@/src/features/auth/authTypes';

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

function parseXhrError(xhr: XMLHttpRequest): Error {
  try {
    const errorData = JSON.parse(xhr.responseText);
    let errorMessage = 'An error occurred';
    if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.detail) {
      if (typeof errorData.detail === 'string') errorMessage = errorData.detail;
      else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        errorMessage = errorData.detail[0].msg || JSON.stringify(errorData.detail);
      }
    }
    return new Error(errorMessage);
  } catch {
    return new Error(`Request failed with status ${xhr.status}`);
  }
}

async function customXhr<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requiresAuth = true, ...customOptions } = options;
  const url = `${ENV.API_BASE_URL}${endpoint}`;

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(customOptions.method || 'POST', url);

    if (requiresAuth) {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
    }

    const headers = new Headers(customOptions.headers || {});
    headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-type') {
        xhr.setRequestHeader(key, value);
      }
    });

    xhr.onload = async () => {
      if (xhr.status === 401 && requiresAuth) {
        try {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (!refreshToken) {
            reject(new Error('Session expired'));
            return;
          }
          const refreshResponse = await fetch(`${ENV.API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!refreshResponse.ok) {
            await tokenStorage.clearTokens();
            reject(new Error('Session expired'));
            return;
          }

          const data: AuthResponse = await refreshResponse.json();
          tokenStorage.setAccessToken(data.access_token);
          await tokenStorage.setRefreshToken(data.refresh_token);

          // Retry request
          const retryXhr = new XMLHttpRequest();
          retryXhr.open(customOptions.method || 'POST', url);
          retryXhr.setRequestHeader('Authorization', `Bearer ${data.access_token}`);
          headers.forEach((value, key) => {
            if (key.toLowerCase() !== 'content-type') {
              retryXhr.setRequestHeader(key, value);
            }
          });

          retryXhr.onload = () => {
            if (retryXhr.status >= 200 && retryXhr.status < 300) {
              if (retryXhr.status === 204) resolve({} as T);
              else resolve(JSON.parse(retryXhr.responseText) as T);
            } else {
              reject(parseXhrError(retryXhr));
            }
          };
          retryXhr.onerror = () => reject(new Error('Network request failed'));
          retryXhr.send(customOptions.body);
          return;
        } catch (err) {
          reject(err);
          return;
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.status === 204) resolve({} as T);
        else {
          try {
            resolve(JSON.parse(xhr.responseText) as T);
          } catch (e) {
            reject(e);
          }
        }
      } else {
        reject(parseXhrError(xhr));
      }
    };

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.send(customOptions.body);
  });
}

async function customFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requiresAuth = true, ...customOptions } = options;
  if (customOptions.body instanceof FormData) {
    return customXhr<T>(endpoint, options);
  }
  const url = `${ENV.API_BASE_URL}${endpoint}`;

  const headers = new Headers(customOptions.headers || {});
  if (!headers.has('Content-Type') && !(customOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresAuth) {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const config: RequestInit = {
    ...customOptions,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // Handle 401 token refresh
    if (response.status === 401 && requiresAuth) {
      const refreshToken = await tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber(async (newToken: string) => {
            const newHeaders = new Headers(headers);
            newHeaders.set('Authorization', `Bearer ${newToken}`);
            try {
              const retryResponse = await fetch(url, { ...config, headers: newHeaders });
              if (!retryResponse.ok) throw new Error('Retry failed');
              resolve(retryResponse.json() as Promise<T>);
            } catch (err) {
              reject(err);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${ENV.API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Session expired');
        }

        const data: AuthResponse = await refreshResponse.json();
        tokenStorage.setAccessToken(data.access_token);
        await tokenStorage.setRefreshToken(data.refresh_token);
        
        onRefreshed(data.access_token);
        
        // Retry original request
        headers.set('Authorization', `Bearer ${data.access_token}`);
        response = await fetch(url, { ...config, headers });
      } catch (error) {
        await tokenStorage.clearTokens();
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Standardize extracting the error message
      let errorMessage = 'An error occurred';
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.detail) {
        if (typeof errorData.detail === 'string') errorMessage = errorData.detail;
        else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) errorMessage = errorData.detail[0].msg || JSON.stringify(errorData.detail);
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) => customFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: FetchOptions) => customFetch<T>(endpoint, { ...options, method: 'POST', body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined }),
  patch: <T>(endpoint: string, body?: any, options?: FetchOptions) => customFetch<T>(endpoint, { ...options, method: 'PATCH', body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined }),
  delete: <T>(endpoint: string, options?: FetchOptions) => customFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
