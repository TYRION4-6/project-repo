const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            rawBody: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING REST API VERIFICATION TESTS ---');
  
  try {
    // 1. Test GET /api/outlets
    console.log('\n[1/7] Testing GET /api/outlets...');
    const outletsRes = await request('GET', '/api/outlets');
    if (outletsRes.status === 200 && Array.isArray(outletsRes.body) && outletsRes.body.length > 0) {
      console.log(`✅ Success: Loaded ${outletsRes.body.length} outlets.`);
      console.log('Sample Outlet:', outletsRes.body[0]);
    } else {
      throw new Error(`Failed to load outlets. Status: ${outletsRes.status}`);
    }
    
    const firstOutletId = outletsRes.body[0].id;

    // 2. Test GET /api/products (Default Paginated)
    console.log('\n[2/7] Testing GET /api/products...');
    const productsRes = await request('GET', '/api/products');
    if (productsRes.status === 200 && productsRes.body.products) {
      const { products, total, page, limit, totalPages } = productsRes.body;
      console.log(`✅ Success: Page ${page}/${totalPages}, Limit: ${limit}, Current: ${products.length}, Total Products: ${total}`);
      if (products.length > 0) {
        console.log('Sample Product:', products[0]);
      }
    } else {
      throw new Error(`Failed to load products. Status: ${productsRes.status}`);
    }

    // 3. Test GET /api/products with filter
    console.log('\n[3/7] Testing GET /api/products filtering by outlet and search...');
    const filteredRes = await request('GET', `/api/products?outletId=${firstOutletId}&search=pro`);
    if (filteredRes.status === 200) {
      console.log(`✅ Success: Filtering works. Found ${filteredRes.body.products.length} products matching query.`);
    } else {
      throw new Error(`Filtering failed. Status: ${filteredRes.status}`);
    }

    // 4. Test POST /api/products Form Validation Errors
    console.log('\n[4/7] Testing POST /api/products validation rules...');
    const badProduct = {
      name: 'Ab', // too short
      sku: 'bad_sku', // not uppercase / hyphenated
      price: -10, // negative price
      stock: -5, // negative stock
      outletId: 'non-existent-outlet', // bad outlet
      category: '' // empty category
    };
    const badRes = await request('POST', '/api/products', badProduct);
    if (badRes.status === 400 && badRes.body.errors) {
      console.log('✅ Success: Received expected validation errors:');
      console.log(badRes.body.errors);
    } else {
      throw new Error(`Validation test failed. Status: ${badRes.status}, Body: ${JSON.stringify(badRes.body)}`);
    }

    // 5. Test POST /api/products Successful Creation
    console.log('\n[5/7] Testing POST /api/products success case...');
    const newProduct = {
      name: 'Super High Speed Router',
      sku: 'NET-RT-999',
      price: 129.99,
      stock: 45,
      category: 'Electronics',
      outletId: firstOutletId,
      description: 'Dual-band Gigabit Wi-Fi 6 router'
    };
    const createRes = await request('POST', '/api/products', newProduct);
    if (createRes.status === 214 && createRes.body.product) {
      console.log('✅ Success: Product created successfully!');
      console.log('Created product details:', createRes.body.product);
    } else {
      throw new Error(`Product creation failed. Status: ${createRes.status}, Body: ${JSON.stringify(createRes.body)}`);
    }
    
    const createdProduct = createRes.body.product;

    // 6. Test PUT /api/products/:id (Update)
    console.log('\n[6/7] Testing PUT /api/products/:id updates...');
    const updatePayload = {
      name: 'Super High Speed Router Pro',
      price: 139.99,
      stock: 40 // Decreased stock
    };
    const updateRes = await request('PUT', `/api/products/${createdProduct.id}`, updatePayload);
    if (updateRes.status === 200 && updateRes.body.product) {
      console.log('✅ Success: Product updated successfully!');
      console.log('Updated product details:', updateRes.body.product);
      if (updateRes.body.product.name === 'Super High Speed Router Pro' && updateRes.body.product.price === 139.99) {
        console.log('   Confirmed name and price update values match.');
      } else {
        throw new Error('Updated fields do not match.');
      }
    } else {
      throw new Error(`Product update failed. Status: ${updateRes.status}`);
    }

    // 7. Test DELETE /api/products/:id (Delete)
    console.log('\n[7/7] Testing DELETE /api/products/:id...');
    const deleteRes = await request('DELETE', `/api/products/${createdProduct.id}`);
    if (deleteRes.status === 200 && deleteRes.body.id === createdProduct.id) {
      console.log('✅ Success: Product deleted successfully.');
    } else {
      throw new Error(`Product deletion failed. Status: ${deleteRes.status}`);
    }
    
    console.log('\n🌟 ALL REST API ENDPOINT TESTS COMPLETED SUCCESSFULLY! 🌟');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
