const BASE_URL = "http://localhost:3000/api";

const apiCall = async (endpoint, method = "GET", body = null, token = null) => {
    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        let data;
        const text = await response.text();
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
        }

        if (!response.ok) {
            throw new Error(data?.message || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error.message);
        throw error;
    }
};

export const api = {
    // Auth endpoints
    login: (credentials) => apiCall("/auth/login", "POST", credentials),
    register: (userData) => apiCall("/auth/register", "POST", userData),
    getProfile: (token) => apiCall("/auth/me", "GET", null, token),

    // Outlets endpoints
    getOutlets: (token) => apiCall("/outlets", "GET", null, token),
    createOutlet: (data, token) => apiCall("/outlets", "POST", data, token),
    updateOutlet: (id, data, token) => apiCall(`/outlets/${id}`, "PUT", data, token),
    deleteOutlet: (id, token) => apiCall(`/outlets/${id}`, "DELETE", null, token),

    // Products endpoints
    getProducts: (filters = {}, token) => {
        const queryParams = new URLSearchParams();
        if (filters.outlet) queryParams.append("outlet", filters.outlet);
        if (filters.category) queryParams.append("category", filters.category);
        if (filters.lowStock) queryParams.append("lowStock", filters.lowStock);
        
        const queryStr = queryParams.toString();
        const endpoint = `/products${queryStr ? `?${queryStr}` : ""}`;
        return apiCall(endpoint, "GET", null, token);
    },
    getProductsPaginated: (filters = {}, token) => {
        const queryParams = new URLSearchParams();
        if (filters.outlet) queryParams.append("outlet", filters.outlet);
        if (filters.page) queryParams.append("page", filters.page);
        if (filters.limit) queryParams.append("limit", filters.limit);
        
        const queryStr = queryParams.toString();
        const endpoint = `/products${queryStr ? `?${queryStr}` : ""}`;
        return apiCall(endpoint, "GET", null, token);
    },
    createProduct: (data, token) => apiCall("/products", "POST", data, token),
    updateProduct: (id, data, token) => apiCall(`/products/${id}`, "PUT", data, token),
    deleteProduct: (id, token) => apiCall(`/products/${id}`, "DELETE", null, token),

    // Sales endpoints
    recordSale: (data, token) => apiCall("/sales", "POST", data, token),
    getSales: (token) => apiCall("/sales", "GET", null, token),
    getAnalytics: (token) => apiCall("/sales/analytics", "GET", null, token)
};
