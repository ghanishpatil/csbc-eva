import http from 'http';

/**
 * Simple backend test script
 * Run: node scripts/test-backend.js
 */

const BASE_URL = 'http://localhost:5000';
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'test_admin_key';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const makeRequest = (path, method = 'GET', data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

const runTests = async () => {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 MISSION EXPLOIT 2.0 - BACKEND TEST SUITE', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  try {
    log('Test 1: Health Check...', 'yellow');
    const response = await makeRequest('/health');
    if (response.status === 200 && response.data.success) {
      log('✅ PASSED - Server is healthy\n', 'green');
      passed++;
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Test 2: API info
  try {
    log('Test 2: API Info Endpoint...', 'yellow');
    const response = await makeRequest('/api');
    if (response.status === 200 && response.data.success) {
      log('✅ PASSED - API info retrieved\n', 'green');
      passed++;
    } else {
      throw new Error('API info failed');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Test 3: Flag submission (incorrect flag)
  try {
    log('Test 3: Flag Submission (Incorrect)...', 'yellow');
    const response = await makeRequest('/api/submit-flag', 'POST', {
      teamId: 'test_team',
      levelId: 'level_1',
      flag: 'ME2{wrong_flag}',
      timeTaken: 30,
      captainId: 'test_captain',
    });
    if (response.data.status === 'incorrect') {
      log('✅ PASSED - Incorrect flag rejected\n', 'green');
      passed++;
    } else {
      throw new Error('Should reject incorrect flag');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Test 4: Flag format validation
  try {
    log('Test 4: Flag Format Validation...', 'yellow');
    const response = await makeRequest('/api/submit-flag', 'POST', {
      teamId: 'test_team',
      levelId: 'level_1',
      flag: 'invalid_format',
      timeTaken: 30,
      captainId: 'test_captain',
    });
    if (response.data.message.includes('Invalid flag format')) {
      log('✅ PASSED - Invalid format rejected\n', 'green');
      passed++;
    } else {
      throw new Error('Should reject invalid flag format');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Test 5: Input validation
  try {
    log('Test 5: Input Validation (Missing Fields)...', 'yellow');
    const response = await makeRequest('/api/submit-flag', 'POST', {
      teamId: 'test_team',
      // Missing required fields
    });
    if (response.status === 400) {
      log('✅ PASSED - Invalid input rejected\n', 'green');
      passed++;
    } else {
      throw new Error('Should reject invalid input');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Test 6: Admin endpoint without auth
  try {
    log('Test 6: Admin Endpoint (No Auth)...', 'yellow');
    const response = await makeRequest('/api/admin/stats');
    if (response.status === 403) {
      log('✅ PASSED - Unauthorized access blocked\n', 'green');
      passed++;
    } else {
      throw new Error('Should block unauthorized access');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Test 7: Admin endpoint with auth
  try {
    log('Test 7: Admin Endpoint (With Auth)...', 'yellow');
    const response = await makeRequest('/api/admin/stats', 'GET', null, {
      'X-Admin-Key': ADMIN_KEY,
    });
    if (response.status === 200 && response.data.success) {
      log('✅ PASSED - Admin stats retrieved\n', 'green');
      passed++;
    } else {
      throw new Error('Admin endpoint failed');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Test 8: 404 handler
  try {
    log('Test 8: 404 Handler...', 'yellow');
    const response = await makeRequest('/nonexistent-endpoint');
    if (response.status === 404) {
      log('✅ PASSED - 404 handled correctly\n', 'green');
      passed++;
    } else {
      throw new Error('Should return 404');
    }
  } catch (error) {
    log(`❌ FAILED - ${error.message}\n`, 'red');
    failed++;
  }

  // Summary
  log('='.repeat(60), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`📊 Total:  ${passed + failed}`, 'yellow');
  log('='.repeat(60) + '\n', 'blue');

  if (failed === 0) {
    log('🎉 All tests passed! Backend is working correctly.\n', 'green');
  } else {
    log('⚠️  Some tests failed. Check the errors above.\n', 'yellow');
  }

  process.exit(failed > 0 ? 1 : 0);
};

// Check if server is running
log('Checking if server is running on ' + BASE_URL + '...', 'yellow');
makeRequest('/health')
  .then(() => {
    log('✅ Server is running! Starting tests...\n', 'green');
    runTests();
  })
  .catch(() => {
    log('❌ Server is not running!', 'red');
    log('Please start the server with: npm run dev\n', 'yellow');
    process.exit(1);
  });

