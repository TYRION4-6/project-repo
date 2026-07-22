const API_URL = "http://localhost:5050/api";

// Helper to get headers with JWT token
const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Generic response handler
const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    // If unauthorized, clear token and redirect (optional, depending on state)
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    throw new Error(data.msg || data.message || "An error occurred");
  }
  return data;
};

export const api = {
  // Auth endpoints
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return data;
    },
    register: async (name, email, password) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return data;
    },
    getMe: async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  // Outlet endpoints
  outlets: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/outlets`, {
        method: "GET",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (outletData) => {
      const res = await fetch(`${API_URL}/outlets`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(outletData),
      });
      return handleResponse(res);
    },
    update: async (id, outletData) => {
      const res = await fetch(`${API_URL}/outlets/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(outletData),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/outlets/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // Product endpoints
  products: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/products`, {
        method: "GET",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (productData) => {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(productData),
      });
      return handleResponse(res);
    },
    update: async (id, productData) => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(productData),
      });
      return handleResponse(res);
    },
    updateStock: async (productId, outletId, quantity, threshold) => {
      const res = await fetch(`${API_URL}/products/${productId}/stock`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ outletId, quantity, threshold }),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // Sales endpoints
  sales: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/sales`, {
        method: "GET",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (saleData) => {
      const res = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(saleData),
      });
      return handleResponse(res);
    },
    getAnalytics: async () => {
      const res = await fetch(`${API_URL}/sales/analytics`, {
        method: "GET",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // Alert endpoints
  alerts: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/alerts`, {
        method: "GET",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  }
};
