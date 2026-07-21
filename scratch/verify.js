const http = require("http");

const loginData = JSON.stringify({
  email: "manager@metro.com",
  password: "password123"
});

const makeRequest = (url, method, headers, body) => {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
};

async function run() {
  try {
    console.log("1. Logging in...");
    const loginRes = await makeRequest("http://localhost:5000/auth/login", "POST", {}, loginData);
    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }
    const token = loginRes.body.token;
    console.log("Login successful! Token acquired.");

    const headers = { Authorization: `Bearer ${token}` };

    console.log("\n2. Fetching all outlets...");
    const getRes = await makeRequest("http://localhost:5000/outlets", "GET", headers);
    if (getRes.status !== 200) {
      throw new Error(`Get outlets failed with status ${getRes.status}`);
    }
    const outlets = getRes.body;
    console.log(`Found ${outlets.length} outlets.`);
    if (outlets.length === 0) {
      throw new Error("No outlets found to test update!");
    }

    const testOutlet = outlets[0];
    console.log(`Selected outlet for test: "${testOutlet.name}" (${testOutlet._id})`);

    const originalData = {
      name: testOutlet.name,
      city: testOutlet.city,
      address: testOutlet.address,
      phone: testOutlet.phone
    };

    const updatedData = {
      name: testOutlet.name + " - Verified",
      city: testOutlet.city,
      address: testOutlet.address,
      phone: testOutlet.phone
    };

    console.log(`\n3. Updating outlet to: "${updatedData.name}"...`);
    const updateRes = await makeRequest(
      `http://localhost:5000/outlets/${testOutlet._id}`,
      "PUT",
      headers,
      JSON.stringify(updatedData)
    );

    if (updateRes.status !== 200) {
      throw new Error(`Update outlet failed with status ${updateRes.status}: ${JSON.stringify(updateRes.body)}`);
    }
    console.log("Update successful! Server returned updated outlet:", updateRes.body);

    console.log("\n4. Re-fetching outlets to confirm changes are saved...");
    const getRes2 = await makeRequest("http://localhost:5000/outlets", "GET", headers);
    const updatedOutlet = getRes2.body.find(o => o._id === testOutlet._id);
    console.log("Fetched updated outlet from DB:", updatedOutlet);
    if (updatedOutlet.name !== updatedData.name) {
      throw new Error(`Expected name to be "${updatedData.name}", but got "${updatedOutlet.name}"`);
    }
    console.log("Verification PASSED: DB contains the updated information.");

    console.log(`\n5. Reverting outlet back to: "${originalData.name}"...`);
    const revertRes = await makeRequest(
      `http://localhost:5000/outlets/${testOutlet._id}`,
      "PUT",
      headers,
      JSON.stringify(originalData)
    );
    if (revertRes.status !== 200) {
      throw new Error(`Revert outlet failed with status ${revertRes.status}`);
    }
    console.log("Revert successful! Database restored to original state.");

  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  }
}

run();
