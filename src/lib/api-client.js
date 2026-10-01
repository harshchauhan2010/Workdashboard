/**
 * Unified API Client for WorkDashboard
 * Handles automatic JSON serialization, error extraction, and status parsing.
 */

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, { method = "GET", body, headers = {}, ...customConfig } = {}) {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "same-origin",
    ...customConfig,
  };

  // Automatically attach Clerk Bearer token when in browser and authenticated
  if (typeof window !== "undefined") {
    try {
      if (window.Clerk?.session) {
        const token = await window.Clerk.session.getToken();
        if (token && !config.headers["Authorization"] && !config.headers["authorization"]) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  if (body !== undefined) {
    config.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(url, config);
    let data = null;

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      if (data && typeof data === "object") {
        if (data.error && typeof data.error === "string") {
          errorMessage = data.error;
        } else if (data.message && typeof data.message === "string" && !data.message.startsWith("<!DOCTYPE") && !data.message.startsWith("<html")) {
          errorMessage = data.message;
        }
      }
      throw new ApiError(errorMessage, response.status, data);
    }

    return {
      data,
      status: response.status,
      ok: true,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || "Network connection failed", 500);
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: "GET", ...options }),
  post: (endpoint, body, options = {}) => request(endpoint, { method: "POST", body, ...options }),
  patch: (endpoint, body, options = {}) => request(endpoint, { method: "PATCH", body, ...options }),
  put: (endpoint, body, options = {}) => request(endpoint, { method: "PUT", body, ...options }),
  delete: (endpoint, options = {}) => request(endpoint, { method: "DELETE", ...options }),
};

export { ApiError };
export default api;
