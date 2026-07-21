// Aetheris Outlets - Frontend Application Logic

// API Config
const API_BASE = '/api';

// State Management
let state = {
  outlets: [],
  products: [],
  totalProductsCount: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 8,
  selectedOutlet: 'all',
  searchQuery: '',
  editingProduct: null,
  deletingProduct: null
};

// DOM Elements
const elements = {
  currentTime: document.getElementById('current-time'),
  
  // Metrics
  statTotalProducts: document.getElementById('stat-total-products'),
  statTotalVal: document.getElementById('stat-total-val'),
  statLowStock: document.getElementById('stat-low-stock'),
  statLowStockCard: document.getElementById('low-stock-card'),
  statLowStockSubtext: document.getElementById('stat-low-stock-subtext'),
  statTotalOutlets: document.getElementById('stat-total-outlets'),
  
  // Toolbar
  outletFilter: document.getElementById('outlet-filter'),
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  addProductBtn: document.getElementById('add-product-btn'),
  
  // Table
  productsTableBody: document.getElementById('products-table-body'),
  paginationInfo: document.getElementById('pagination-info'),
  paginationControls: document.getElementById('pagination-controls'),
  
  // Modals
  productModal: document.getElementById('product-modal'),
  modalTitle: document.getElementById('modal-title'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  cancelFormBtn: document.getElementById('cancel-form-btn'),
  productForm: document.getElementById('product-form'),
  saveProductBtn: document.getElementById('save-product-btn'),
  generateSkuBtn: document.getElementById('generate-sku-btn'),
  
  // Form Fields
  formProductId: document.getElementById('form-product-id'),
  formName: document.getElementById('form-name'),
  formSku: document.getElementById('form-sku'),
  formCategory: document.getElementById('form-category'),
  formPrice: document.getElementById('form-price'),
  formStock: document.getElementById('form-stock'),
  formOutlet: document.getElementById('form-outlet'),
  formDescription: document.getElementById('form-description'),
  
  // Deletion Modal
  deleteModal: document.getElementById('delete-modal'),
  deleteProductName: document.getElementById('delete-product-name'),
  deleteProductOutlet: document.getElementById('delete-product-outlet'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  
  // Notifications
  toastContainer: document.getElementById('toast-container')
};

// ----------------- Initialization & Setup -----------------

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Start clock
  updateClock();
  setInterval(updateClock, 1000);
  
  // Fetch initial data
  loadOutlets().then(() => {
    loadProducts();
  });
  
  // Bind Event Listeners
  setupEventListeners();
}

function updateClock() {
  const options = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  };
  const now = new Date();
  elements.currentTime.querySelector('span').textContent = now.toLocaleDateString('en-US', options);
}

// ----------------- Event Listeners -----------------

function setupEventListeners() {
  // Outlet Filter
  elements.outletFilter.addEventListener('change', (e) => {
    state.selectedOutlet = e.target.value;
    state.currentPage = 1;
    loadProducts();
  });
  
  // Search Input
  let searchTimeout = null;
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    state.currentPage = 1;
    
    // Toggle clear button
    if (state.searchQuery.length > 0) {
      elements.searchClearBtn.style.display = 'flex';
    } else {
      elements.searchClearBtn.style.display = 'none';
    }
    
    // Debounce search API calls
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadProducts();
    }, 400);
  });
  
  // Clear search button
  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.searchClearBtn.style.display = 'none';
    state.currentPage = 1;
    loadProducts();
  });
  
  // Modal buttons
  elements.addProductBtn.addEventListener('click', () => openProductModal());
  elements.closeModalBtn.addEventListener('click', closeProductModal);
  elements.cancelFormBtn.addEventListener('click', closeProductModal);
  
  // Form submission
  elements.productForm.addEventListener('submit', handleFormSubmit);
  
  // Generate SKU helper
  elements.generateSkuBtn.addEventListener('click', generateSkuAction);
  
  // Form live validation on input/change
  const formInputs = [
    { el: elements.formName, errId: 'error-name' },
    { el: elements.formSku, errId: 'error-sku' },
    { el: elements.formCategory, errId: 'error-category' },
    { el: elements.formPrice, errId: 'error-price' },
    { el: elements.formStock, errId: 'error-stock' },
    { el: elements.formOutlet, errId: 'error-outlet' }
  ];
  
  formInputs.forEach(item => {
    item.el.addEventListener('input', () => {
      clearFieldError(item.el, item.errId);
    });
    item.el.addEventListener('change', () => {
      clearFieldError(item.el, item.errId);
    });
  });
  
  // Delete Modal buttons
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', handleProductDelete);
  
  // Close modals on clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === elements.productModal) closeProductModal();
    if (e.target === elements.deleteModal) closeDeleteModal();
  });
}

// ----------------- Data Loading (GET Calls) -----------------

// Fetch outlets from backend
async function loadOutlets() {
  try {
    const res = await fetch(`${API_BASE}/outlets`);
    if (!res.ok) throw new Error('Failed to load outlets.');
    
    const outlets = await res.json();
    state.outlets = outlets;
    
    // Update active outlets metric
    elements.statTotalOutlets.textContent = outlets.length;
    
    // Populate outlet filter dropdown
    elements.outletFilter.innerHTML = '<option value="all">All Outlets</option>';
    outlets.forEach(outlet => {
      const option = document.createElement('option');
      option.value = outlet.id;
      option.textContent = outlet.name;
      elements.outletFilter.appendChild(option);
    });
    
    // Populate form outlet assignment selection
    elements.formOutlet.innerHTML = '<option value="" disabled selected>Select an outlet...</option>';
    outlets.forEach(outlet => {
      const option = document.createElement('option');
      option.value = outlet.id;
      option.textContent = outlet.name;
      elements.formOutlet.appendChild(option);
    });
    
  } catch (error) {
    console.error(error);
    showToast('API Error', 'Could not fetch outlets list from the backend.', 'error');
  }
}

// Fetch products from backend with current filters & pagination
async function loadProducts(highlightProductId = null) {
  // Show table loading state
  showTableLoading();
  
  try {
    const queryParams = new URLSearchParams({
      outletId: state.selectedOutlet,
      search: state.searchQuery,
      page: state.currentPage,
      limit: state.limit
    });
    
    const res = await fetch(`${API_BASE}/products?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Failed to load products.');
    
    const data = await res.json();
    state.products = data.products;
    state.currentPage = data.page;
    state.totalPages = data.totalPages;
    state.totalProductsCount = data.total;
    
    // Update metrics counts
    updateMetricsSummary();
    
    // Render Products Table
    renderProductsTable(highlightProductId);
    
    // Render Pagination Controls
    renderPagination();
    
  } catch (error) {
    console.error(error);
    showToast('API Error', 'Could not sync inventory with the server.', 'error');
    showTableEmpty('error', 'Error syncing with backend database.');
  }
}

// Compute and Update Summary Metrics
async function updateMetricsSummary() {
  try {
    // To get true overall metrics (independent of pagination and outlet filter),
    // we fetch the full list of products.
    const res = await fetch(`${API_BASE}/products?limit=9999`);
    if (!res.ok) return;
    const data = await res.json();
    const allProducts = data.products;
    
    // 1. Total Products
    elements.statTotalProducts.textContent = allProducts.length;
    
    // 2. Inventory Value
    const totalVal = allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
    elements.statTotalVal.textContent = `$${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // 3. Low Stock Alerts (Stock < 20)
    const lowStockCount = allProducts.filter(p => p.stock < 20).length;
    elements.statLowStock.textContent = lowStockCount;
    
    if (lowStockCount > 0) {
      elements.statLowStockCard.classList.add('has-alerts');
      elements.statLowStockSubtext.textContent = `${lowStockCount} items require restocking`;
    } else {
      elements.statLowStockCard.classList.remove('has-alerts');
      elements.statLowStockSubtext.textContent = 'Inventory levels normal';
    }
  } catch (e) {
    console.error('Error loading dashboard stats:', e);
  }
}

// ----------------- DOM Rendering Helpers -----------------

function showTableLoading() {
  elements.productsTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-state">
        <div class="spinner-container">
          <div class="spinner"></div>
          <p>Syncing inventory data...</p>
        </div>
      </td>
    </tr>
  `;
}

function showTableEmpty(type = 'empty', customMessage = '') {
  let title = 'No Products Found';
  let message = 'Try expanding your search parameters or select a different outlet.';
  let icon = 'fa-boxes-packing';
  
  if (type === 'error') {
    title = 'Database Connection Failed';
    message = customMessage || 'We were unable to connect to the backend server. Please verify if the Node.js API is running.';
    icon = 'fa-triangle-exclamation';
  } else if (state.searchQuery) {
    title = 'No Search Matches';
    message = `No products matched your search for "${state.searchQuery}".`;
    icon = 'fa-magnifying-glass';
  }
  
  elements.productsTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty-state">
        <div class="empty-state-content">
          <i class="fa-solid ${icon} empty-state-icon"></i>
          <h3>${title}</h3>
          <p>${message}</p>
          ${state.searchQuery || state.selectedOutlet !== 'all' ? `
            <button class="btn btn-secondary" onclick="clearAllFilters()">
              <i class="fa-solid fa-filter-circle-xmark"></i> Clear Filters
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `;
  
  // Update footer count text
  elements.paginationInfo.innerHTML = 'Showing <span class="highlight">0</span> products';
  elements.paginationControls.innerHTML = '';
}

window.clearAllFilters = function() {
  elements.searchInput.value = '';
  state.searchQuery = '';
  elements.searchClearBtn.style.display = 'none';
  state.selectedOutlet = 'all';
  elements.outletFilter.value = 'all';
  state.currentPage = 1;
  loadProducts();
};

function renderProductsTable(highlightProductId = null) {
  if (state.products.length === 0) {
    showTableEmpty('empty');
    return;
  }
  
  elements.productsTableBody.innerHTML = '';
  
  state.products.forEach(p => {
    const tr = document.createElement('tr');
    tr.id = `product-row-${p.id}`;
    
    if (highlightProductId && p.id === highlightProductId) {
      tr.classList.add('row-highlight');
    }
    
    // Format Stock Badge
    let stockClass = 'stock-in';
    let stockLabel = 'In Stock';
    if (p.stock === 0) {
      stockClass = 'stock-out';
      stockLabel = 'Out of Stock';
    } else if (p.stock < 20) {
      stockClass = 'stock-low';
      stockLabel = 'Low Stock';
    }
    
    tr.innerHTML = `
      <td>
        <div class="product-cell">
          <span class="product-name-txt">${escapeHtml(p.name)}</span>
          <span class="product-desc-txt" title="${escapeHtml(p.description || '')}">${escapeHtml(p.description || 'No description provided.')}</span>
        </div>
      </td>
      <td>
        <span class="sku-badge">${escapeHtml(p.sku)}</span>
      </td>
      <td>
        <span class="category-tag">
          <i class="fa-solid fa-tags"></i> ${escapeHtml(p.category)}
        </span>
      </td>
      <td class="text-right">
        <span class="price-text">$${p.price.toFixed(2)}</span>
      </td>
      <td class="text-center">
        <span class="stock-badge ${stockClass}">${stockLabel}</span>
        <span class="stock-number">${p.stock} units</span>
      </td>
      <td>
        <div class="outlet-tag">
          <i class="fa-solid fa-shop"></i>
          <span>${escapeHtml(p.outletName)}</span>
        </div>
      </td>
      <td class="text-center">
        <div class="action-buttons">
          <button class="action-btn edit-btn" title="Edit Product" onclick="openEditModal('${p.id}')">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="action-btn delete-btn" title="Delete Product" onclick="openDeleteModal('${p.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    
    elements.productsTableBody.appendChild(tr);
  });
  
  // Update footer text
  const startItem = (state.currentPage - 1) * state.limit + 1;
  const endItem = Math.min(startItem + state.products.length - 1, state.totalProductsCount);
  
  elements.paginationInfo.innerHTML = `
    Showing <span class="highlight">${startItem}</span> to <span class="highlight">${endItem}</span> of <span class="highlight">${state.totalProductsCount}</span> products
  `;
}

function renderPagination() {
  elements.paginationControls.innerHTML = '';
  
  if (state.totalPages <= 1) {
    return;
  }
  
  // Previous Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pg-btn';
  prevBtn.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      loadProducts();
    }
  });
  elements.paginationControls.appendChild(prevBtn);
  
  // Page Numbers
  // Display page numbers with smart ellipsis for high count pages
  const range = 1; // Number of pages adjacent to current page
  for (let i = 1; i <= state.totalPages; i++) {
    if (i === 1 || i === state.totalPages || (i >= state.currentPage - range && i <= state.currentPage + range)) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `pg-btn ${state.currentPage === i ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        state.currentPage = i;
        loadProducts();
      });
      elements.paginationControls.appendChild(pageBtn);
    } else if (
      (i === state.currentPage - range - 1 && i > 1) || 
      (i === state.currentPage + range + 1 && i < state.totalPages)
    ) {
      const dots = document.createElement('span');
      dots.className = 'pg-dots';
      dots.textContent = '...';
      elements.paginationControls.appendChild(dots);
    }
  }
  
  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pg-btn';
  nextBtn.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
  nextBtn.disabled = state.currentPage === state.totalPages;
  nextBtn.addEventListener('click', () => {
    if (state.currentPage < state.totalPages) {
      state.currentPage++;
      loadProducts();
    }
  });
  elements.paginationControls.appendChild(nextBtn);
}

// ----------------- Add & Edit Modal Handlers -----------------

function openProductModal(product = null) {
  // Clear any existing errors
  clearAllErrors();
  
  if (product) {
    // Edit Mode
    state.editingProduct = product;
    elements.modalTitle.textContent = 'Edit Product Details';
    elements.saveProductBtn.querySelector('.btn-text').textContent = 'Save Changes';
    
    // Fill Form fields
    elements.formProductId.value = product.id;
    elements.formName.value = product.name;
    elements.formSku.value = product.sku;
    elements.formCategory.value = product.category;
    elements.formPrice.value = product.price;
    elements.formStock.value = product.stock;
    elements.formOutlet.value = product.outletId;
    elements.formDescription.value = product.description || '';
  } else {
    // Add Mode
    state.editingProduct = null;
    elements.modalTitle.textContent = 'Add New Product';
    elements.saveProductBtn.querySelector('.btn-text').textContent = 'Add Product';
    
    // Clear fields
    elements.productForm.reset();
    elements.formProductId.value = '';
    
    // Set default category / outlet if filters are active
    if (state.selectedOutlet !== 'all') {
      elements.formOutlet.value = state.selectedOutlet;
    }
  }
  
  // Show Modal
  elements.productModal.classList.add('show');
  
  // Focus name field
  setTimeout(() => {
    elements.formName.focus();
  }, 100);
}

function closeProductModal() {
  elements.productModal.classList.remove('show');
  elements.productForm.reset();
  state.editingProduct = null;
}

// Global modal trigger shortcuts mapped in inline onClick actions
window.openEditModal = function(id) {
  const product = state.products.find(p => p.id === id);
  if (product) {
    openProductModal(product);
  } else {
    // Fallback: fetch single product details if not in current page state
    fetch(`${API_BASE}/products?limit=9999`)
      .then(res => res.json())
      .then(data => {
        const p = data.products.find(x => x.id === id);
        if (p) openProductModal(p);
      });
  }
};

// ----------------- SKU Generator -----------------

function generateSkuAction() {
  const name = elements.formName.value.trim();
  const category = elements.formCategory.value.trim();
  
  if (!name || !category) {
    showToast('SKU Helper', 'Please enter a Product Name and Category first to auto-generate a SKU.', 'warning');
    
    if (!category) {
      setFieldError(elements.formCategory, 'error-category', 'Category needed for SKU generation.');
      elements.formCategory.focus();
    }
    if (!name) {
      setFieldError(elements.formName, 'error-name', 'Product Name needed for SKU generation.');
      elements.formName.focus();
    }
    return;
  }
  
  // Generate SKU prefix
  const catPrefix = category.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
  const nameParts = name.split(/\s+/).map(p => p.replace(/[^a-zA-Z0-9]/g, ''));
  let namePrefix = '';
  
  if (nameParts.length >= 2) {
    namePrefix = (nameParts[0].slice(0, 2) + nameParts[1].slice(0, 2)).toUpperCase();
  } else {
    namePrefix = nameParts[0].slice(0, 4).toUpperCase();
  }
  
  // Add a clean 3 digit numeric code
  const randomNum = Math.floor(100 + Math.random() * 900);
  const generatedSku = `${catPrefix}-${namePrefix}-${randomNum}`;
  
  elements.formSku.value = generatedSku;
  clearFieldError(elements.formSku, 'error-sku');
  
  showToast('SKU Generated', `Created SKU code: ${generatedSku}`, 'success');
}

// ----------------- Form Validation Helpers -----------------

function setFieldError(inputEl, errorId, message) {
  const group = inputEl.closest('.form-group');
  if (group) group.classList.add('has-error');
  
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.opacity = 1;
  }
}

function clearFieldError(inputEl, errorId) {
  const group = inputEl.closest('.form-group');
  if (group) group.classList.remove('has-error');
  
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.opacity = 0;
  }
}

function clearAllErrors() {
  const errorMsgs = document.querySelectorAll('.error-msg');
  errorMsgs.forEach(el => {
    el.textContent = '';
    el.style.opacity = 0;
  });
  
  const groups = document.querySelectorAll('.form-group');
  groups.forEach(el => el.classList.remove('has-error'));
}

function validateProductForm() {
  let isValid = true;
  clearAllErrors();
  
  // 1. Name Validation
  const name = elements.formName.value.trim();
  if (!name) {
    setFieldError(elements.formName, 'error-name', 'Product Name is required.');
    isValid = false;
  } else if (name.length < 3) {
    setFieldError(elements.formName, 'error-name', 'Product Name must be at least 3 characters.');
    isValid = false;
  } else if (name.length > 100) {
    setFieldError(elements.formName, 'error-name', 'Product Name cannot exceed 100 characters.');
    isValid = false;
  }
  
  // 2. SKU Validation
  const sku = elements.formSku.value.trim();
  const skuPattern = /^[A-Z0-9-]+$/;
  if (!sku) {
    setFieldError(elements.formSku, 'error-sku', 'SKU identifier code is required.');
    isValid = false;
  } else if (!skuPattern.test(sku)) {
    setFieldError(elements.formSku, 'error-sku', 'SKU must contain only uppercase letters, numbers, and hyphens (e.g. ELEC-KB-102).');
    isValid = false;
  }
  
  // 3. Category Validation
  const category = elements.formCategory.value.trim();
  if (!category) {
    setFieldError(elements.formCategory, 'error-category', 'Category classification is required.');
    isValid = false;
  }
  
  // 4. Price Validation
  const priceVal = elements.formPrice.value;
  const price = parseFloat(priceVal);
  if (priceVal === '') {
    setFieldError(elements.formPrice, 'error-price', 'Unit price is required.');
    isValid = false;
  } else if (isNaN(price) || price <= 0) {
    setFieldError(elements.formPrice, 'error-price', 'Price must be a positive number greater than 0.');
    isValid = false;
  }
  
  // 5. Stock Level Validation
  const stockVal = elements.formStock.value;
  const stock = parseInt(stockVal);
  if (stockVal === '') {
    setFieldError(elements.formStock, 'error-stock', 'Stock level count is required.');
    isValid = false;
  } else if (isNaN(stock) || stock < 0) {
    setFieldError(elements.formStock, 'error-stock', 'Stock level cannot be negative.');
    isValid = false;
  }
  
  // 6. Outlet Validation
  const outletId = elements.formOutlet.value;
  if (!outletId) {
    setFieldError(elements.formOutlet, 'error-outlet', 'Assigning an outlet is required.');
    isValid = false;
  }
  
  return isValid;
}

// ----------------- Add & Edit (POST & PUT API Calls) -----------------

async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Pre-validate client side
  if (!validateProductForm()) {
    showToast('Validation Error', 'Please correct the errors in the form before submitting.', 'warning');
    return;
  }
  
  // Gather Form Data
  const productData = {
    name: elements.formName.value.trim(),
    sku: elements.formSku.value.trim().toUpperCase(),
    category: elements.formCategory.value.trim(),
    price: parseFloat(elements.formPrice.value),
    stock: parseInt(elements.formStock.value),
    outletId: elements.formOutlet.value,
    description: elements.formDescription.value.trim()
  };
  
  // Show Spinner and disable submit
  setSubmitLoadingState(true);
  
  const isEdit = !!state.editingProduct;
  const url = isEdit 
    ? `${API_BASE}/products/${state.editingProduct.id}`
    : `${API_BASE}/products`;
  
  const method = isEdit ? 'PUT' : 'POST';
  
  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      // Server-side validation errors
      if (data.errors) {
        Object.keys(data.errors).forEach(field => {
          let inputEl;
          let errId;
          
          if (field === 'name') { inputEl = elements.formName; errId = 'error-name'; }
          else if (field === 'sku') { inputEl = elements.formSku; errId = 'error-sku'; }
          else if (field === 'category') { inputEl = elements.formCategory; errId = 'error-category'; }
          else if (field === 'price') { inputEl = elements.formPrice; errId = 'error-price'; }
          else if (field === 'stock') { inputEl = elements.formStock; errId = 'error-stock'; }
          else if (field === 'outletId') { inputEl = elements.formOutlet; errId = 'error-outlet'; }
          
          if (inputEl && errId) {
            setFieldError(inputEl, errId, data.errors[field]);
          }
        });
        throw new Error(data.message || 'Server validation failed.');
      } else {
        throw new Error(data.message || 'Operation failed.');
      }
    }
    
    // Success
    showToast(
      isEdit ? 'Inventory Updated' : 'Product Registered', 
      data.message || (isEdit ? 'Product details updated successfully.' : 'New product registered successfully.'),
      'success'
    );
    
    // Close modal
    closeProductModal();
    
    // Reload products and highlight the changes
    const targetProductId = data.product ? data.product.id : null;
    loadProducts(targetProductId);
    
  } catch (error) {
    console.error(error);
    showToast('Save Error', error.message || 'An error occurred while saving product details.', 'error');
  } finally {
    setSubmitLoadingState(false);
  }
}

function setSubmitLoadingState(isLoading) {
  if (isLoading) {
    elements.saveProductBtn.disabled = true;
    elements.saveProductBtn.querySelector('.btn-text').classList.add('hidden');
    elements.saveProductBtn.querySelector('.btn-spinner').classList.remove('hidden');
  } else {
    elements.saveProductBtn.disabled = false;
    elements.saveProductBtn.querySelector('.btn-text').classList.remove('hidden');
    elements.saveProductBtn.querySelector('.btn-spinner').classList.add('hidden');
  }
}

// ----------------- Delete Product (DELETE API Call) -----------------

window.openDeleteModal = function(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  
  state.deletingProduct = product;
  
  elements.deleteProductName.textContent = product.name;
  elements.deleteProductOutlet.textContent = product.outletName;
  
  elements.deleteModal.classList.add('show');
};

function closeDeleteModal() {
  elements.deleteModal.classList.remove('show');
  state.deletingProduct = null;
}

async function handleProductDelete() {
  if (!state.deletingProduct) return;
  
  // Show spinner
  elements.confirmDeleteBtn.disabled = true;
  elements.confirmDeleteBtn.querySelector('.btn-text').classList.add('hidden');
  elements.confirmDeleteBtn.querySelector('.btn-spinner').classList.remove('hidden');
  
  try {
    const res = await fetch(`${API_BASE}/products/${state.deletingProduct.id}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message || 'Failed to delete product.');
    
    // Close delete modal
    closeDeleteModal();
    
    showToast('Product Removed', `${data.message || 'Product removed successfully.'}`, 'success');
    
    // Adjust pagination if deleting the last item of a page
    if (state.products.length === 1 && state.currentPage > 1) {
      state.currentPage--;
    }
    
    // Sync products
    loadProducts();
    
  } catch (error) {
    console.error(error);
    showToast('Delete Error', error.message || 'Could not complete deletion command.', 'error');
  } finally {
    elements.confirmDeleteBtn.disabled = false;
    elements.confirmDeleteBtn.querySelector('.btn-text').classList.remove('hidden');
    elements.confirmDeleteBtn.querySelector('.btn-spinner').classList.add('hidden');
  }
}

// ----------------- Toast Notifications -----------------

function showToast(title, message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  
  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Sound effect or screen-reader alert can be hooked here
  
  // Close handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto remove
  setTimeout(() => {
    removeToast(toast);
  }, 4000);
}

function removeToast(toast) {
  toast.style.transform = 'translateX(120%)';
  toast.style.opacity = '0';
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// ----------------- Utility Helpers -----------------

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
