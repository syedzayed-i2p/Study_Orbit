
import http from 'node:http';

const API_URL = 'http://localhost:5000/api';
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'password123',
  fullName: 'Test User',
  username: `testuser_${Date.now()}`
};

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            headers: res.headers,
            json: () => Promise.resolve(JSON.parse(data))
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            headers: res.headers,
            text: () => Promise.resolve(data)
          });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Auth Flow Check ---');

  try {
    // 1. Test Registration
    console.log('\n1. Testing Registration...');
    const regRes = await request(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const regData = await regRes.json();
    if (regRes.ok) {
      console.log('✅ Registration Successful:', regData.email);
    } else {
      console.error('❌ Registration Failed:', regData.message);
      return;
    }

    // 2. Test Login
    console.log('\n2. Testing Login...');
    const loginRes = await request(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginRes.json();
    if (loginRes.ok) {
      console.log('✅ Login Successful:', loginData.email);
    } else {
      console.error('❌ Login Failed:', loginData.message);
    }

    // 3. Test Case-Insensitive Login
    console.log('\n3. Testing Case-Insensitive Login...');
    const ciLoginRes = await request(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email.toUpperCase(),
        password: testUser.password
      })
    });

    if (ciLoginRes.ok) {
      console.log('✅ Case-Insensitive Login Successful');
    } else {
      const ciData = await ciLoginRes.json();
      console.error('❌ Case-Insensitive Login Failed:', ciData.message);
    }

    // 4. Test "Me" endpoint (Session check)
    console.log('\n4. Testing Session (Me endpoint)...');
    const cookies = loginRes.headers['set-cookie'];
    const meRes = await request(`${API_URL}/auth/me`, {
      headers: { 'Cookie': cookies ? cookies.join('; ') : '' }
    });

    if (meRes.ok) {
      const meData = await meRes.json();
      console.log('✅ Session Valid. Authenticated as:', meData.email);
    } else {
      console.error('❌ Session Check Failed');
    }

  } catch (error) {
    console.error('❌ Error during tests:', error.message);
  }

  console.log('\n--- Auth Flow Check Completed ---');
}

runTests();
