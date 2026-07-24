const API_BASE_URL = "http://localhost:5050/api";

const getHeaders = () => {
  const token = localStorage.getItem("metro_token") || "demo_token_metro_2026";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  register: async (data) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  demoLogin: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/demo`, { method: "POST" });
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getHeaders() });
    return res.json();
  },

  // Outlets
  getOutlets: async () => {
    const res = await fetch(`${API_BASE_URL}/outlets`, { headers: getHeaders() });
    return res.json();
  },

  createOutlet: async (data) => {
    const res = await fetch(`${API_BASE_URL}/outlets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateOutlet: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/outlets/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteOutlet: async (id) => {
    const res = await fetch(`${API_BASE_URL}/outlets/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.json();
  },

  // Products
  getProducts: async () => {
    const res = await fetch(`${API_BASE_URL}/products`, { headers: getHeaders() });
    return res.json();
  },

  createProduct: async (data) => {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateProduct: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.json();
  },

  // Inventory
  getInventory: async (outletId = "") => {
    const url = outletId ? `${API_BASE_URL}/inventory?outletId=${outletId}` : `${API_BASE_URL}/inventory`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  restockInventory: async (outletId, productId, quantityToAdd) => {
    const res = await fetch(`${API_BASE_URL}/inventory/restock`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ outletId, productId, quantityToAdd }),
    });
    return res.json();
  },

  getInventoryAlerts: async () => {
    const res = await fetch(`${API_BASE_URL}/inventory/alerts`, { headers: getHeaders() });
    return res.json();
  },

  // Sales
  recordSale: async (saleData) => {
    const res = await fetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(saleData),
    });
    return res.json();
  },

  getSales: async (outletId = "") => {
    const url = outletId ? `${API_BASE_URL}/sales?outletId=${outletId}` : `${API_BASE_URL}/sales`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  getAnalytics: async (outletId = "") => {
    const url = outletId ? `${API_BASE_URL}/sales/analytics?outletId=${outletId}` : `${API_BASE_URL}/sales/analytics`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  // Seed
  seedDemoData: async () => {
    const res = await fetch(`${API_BASE_URL}/seed`, { method: "POST" });
    return res.json();
  },
};
