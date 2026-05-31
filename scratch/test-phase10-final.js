// E2E Verification Test - Phase 10 Final
// Run: node scratch/test-phase10-final.js

const http = require('http');

const BASE_URL = 'http://localhost:3000';

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  async test(name, fn) {
    try {
      await fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  request(method, path, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, body: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, body, headers: res.headers });
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log('='.repeat(60));

    if (this.results.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('\n📋 Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }
  }
}

async function runTests() {
  const runner = new TestRunner();

  console.log('🧪 PlaySphere AI E2E Verification Suite\n');

  // Test 1: Server Health Check
  await runner.test('Server is running on port 3000', async () => {
    const res = await runner.request('GET', '/');
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  // Test 2: Firestore Connection
  await runner.test('Firebase/Firestore connection', async () => {
    const res = await runner.request('GET', '/api/admin/health');
    if (!res.body || res.status !== 200) {
      throw new Error('Firestore connection failed');
    }
  });

  // Test 3: AI Concierge API
  await runner.test('AI Concierge endpoint exists', async () => {
    const res = await runner.request('POST', '/api/concierge/chat', {
      message: 'Find badminton courts in Aliganj',
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Expected 200/201, got ${res.status}`);
    }
  });

  // Test 4: Admin Ingestion API
  await runner.test('Admin ingestion API exists', async () => {
    const res = await runner.request('GET', '/api/admin/discover-infrastructure');
    if (res.status === 200 || res.status === 401 || res.status === 403) {
      // Any of these is acceptable (depends on auth)
      return;
    }
    throw new Error(`Unexpected status: ${res.status}`);
  });

  // Test 5: Venue search endpoint
  await runner.test('Venue search endpoint', async () => {
    const res = await runner.request('GET', '/api/venues?sport=badminton&area=Aliganj');
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  // Test 6: TypeScript compilation
  await runner.test('TypeScript configuration valid', async () => {
    // Check if tsconfig.json exists and is valid
    const fs = require('fs');
    const tsconfig = fs.readFileSync('./tsconfig.json', 'utf8');
    const config = JSON.parse(tsconfig);
    if (!config.compilerOptions) {
      throw new Error('Invalid tsconfig.json');
    }
  });

  // Test 7: Environment variables
  await runner.test('Required env variables configured', async () => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.LLM_API_KEY) {
      throw new Error('Missing required environment variables');
    }
  });

  // Test 8: Shared utilities
  await runner.test('Shared utilities loaded correctly', async () => {
    try {
      const fs = require('fs');
      const constants = fs.readFileSync('./shared/constants/index.ts', 'utf8');
      const helpers = fs.readFileSync('./shared/helpers/index.ts', 'utf8');
      if (!constants.includes('SUPPORTED_SPORTS') || !helpers.includes('calculateDistance')) {
        throw new Error('Utilities incomplete');
      }
    } catch (e) {
      throw new Error(`Utilities not found: ${e.message}`);
    }
  });

  runner.printResults();
  process.exit(runner.results.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
