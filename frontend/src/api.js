const BASE_URL = "http://localhost:5000";

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const authAPI = {
  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  signup: (name, email, password, role) =>
    apiCall("/auth/signup", {
      method: "POST",
      body: { name, email, password, role },
    }),
  getMe: () => apiCall("/auth/me"),
};

export const outletsAPI = {
  getAll: () => apiCall("/outlets"),
  getById: (id) => apiCall(`/outlets/${id}`),
  create: (outlet) =>
    apiCall("/outlets", {
      method: "POST",
      body: outlet,
    }),
  update: (id, outlet) =>
    apiCall(`/outlets/${id}`, {
      method: "PUT",
      body: outlet,
    }),
  delete: (id) =>
    apiCall(`/outlets/${id}`, {
      method: "DELETE",
    }),
};

export const productsAPI = {
  getAll: (outletId = "") =>
    apiCall(`/products${outletId ? `?outlet=${outletId}` : ""}`),
  getById: (id) => apiCall(`/products/${id}`),
  create: (product) =>
    apiCall("/products", {
      method: "POST",
      body: product,
    }),
  update: (id, product) =>
    apiCall(`/products/${id}`, {
      method: "PUT",
      body: product,
    }),
  delete: (id) =>
    apiCall(`/products/${id}`, {
      method: "DELETE",
    }),
};

export const salesAPI = {
  getAll: () => apiCall("/sales"),
  create: (sale) =>
    apiCall("/sales", {
      method: "POST",
      body: sale,
    }),
  getAnalytics: () => apiCall("/sales/analytics"),
};
