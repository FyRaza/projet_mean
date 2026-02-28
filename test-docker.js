/**
 * Script de test pour vérifier que tous les services fonctionnent
 */

const http = require('http');

const BASE_URL = 'http://localhost';
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 80;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testBackend() {
  log('\n🔍 Test du Backend...', 'cyan');
  
  try {
    // Test 1: API de base
    log('  Test 1: API de base...', 'yellow');
    const baseResponse = await makeRequest(`${BASE_URL}:${BACKEND_PORT}/`);
    if (baseResponse.status === 200) {
      log('  ✅ API de base fonctionne', 'green');
      const json = JSON.parse(baseResponse.data);
      log(`     Message: ${json.message}`, 'cyan');
    } else {
      log(`  ❌ API de base: Status ${baseResponse.status}`, 'red');
      return false;
    }

    // Test 2: Documentation Swagger
    log('  Test 2: Documentation Swagger...', 'yellow');
    const swaggerResponse = await makeRequest(`${BASE_URL}:${BACKEND_PORT}/api/docs`);
    if (swaggerResponse.status === 200) {
      log('  ✅ Swagger UI accessible', 'green');
    } else {
      log(`  ⚠️  Swagger UI: Status ${swaggerResponse.status}`, 'yellow');
    }

    // Test 3: Route Google Auth (vérifier qu'elle existe)
    log('  Test 3: Route Google Auth...', 'yellow');
    const googleRouteResponse = await makeRequest(`${BASE_URL}:${BACKEND_PORT}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    // On s'attend à une erreur 400 (token manquant), ce qui signifie que la route existe
    if (googleRouteResponse.status === 400 || googleRouteResponse.status === 401) {
      log('  ✅ Route Google Auth existe et répond', 'green');
    } else {
      log(`  ⚠️  Route Google Auth: Status ${googleRouteResponse.status}`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`  ❌ Erreur backend: ${error.message}`, 'red');
    return false;
  }
}

async function testFrontend() {
  log('\n🔍 Test du Frontend...', 'cyan');
  
  try {
    const frontendResponse = await makeRequest(`${BASE_URL}:${FRONTEND_PORT}/`);
    if (frontendResponse.status === 200) {
      log('  ✅ Frontend accessible', 'green');
      // Vérifier que c'est bien Angular (contient app-root)
      if (frontendResponse.data.includes('app-root') || frontendResponse.data.includes('ng-tailadmin')) {
        log('  ✅ Application Angular détectée', 'green');
      }
      return true;
    } else {
      log(`  ❌ Frontend: Status ${frontendResponse.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Erreur frontend: ${error.message}`, 'red');
    return false;
  }
}

async function testMongoDB() {
  log('\n🔍 Test de MongoDB...', 'cyan');
  
  try {
    // Vérifier que le container MongoDB est en cours d'exécution
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('docker ps --filter "name=mall-mongo" --format "{{.Status}}"', (error, stdout) => {
        if (stdout && stdout.trim().includes('Up')) {
          log('  ✅ MongoDB container en cours d\'exécution', 'green');
          resolve(true);
        } else {
          log('  ⚠️  MongoDB container non détecté', 'yellow');
          resolve(false);
        }
      });
    });
  } catch (error) {
    log(`  ⚠️  Impossible de vérifier MongoDB: ${error.message}`, 'yellow');
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Démarrage des tests Docker...', 'cyan');
  log('=' .repeat(50), 'cyan');

  const results = {
    backend: await testBackend(),
    frontend: await testFrontend(),
    mongodb: await testMongoDB()
  };

  log('\n' + '='.repeat(50), 'cyan');
  log('\n📊 Résultats des tests:', 'cyan');
  log(`  Backend:  ${results.backend ? '✅ OK' : '❌ ÉCHEC'}`, results.backend ? 'green' : 'red');
  log(`  Frontend: ${results.frontend ? '✅ OK' : '❌ ÉCHEC'}`, results.frontend ? 'green' : 'red');
  log(`  MongoDB:  ${results.mongodb ? '✅ OK' : '⚠️  NON VÉRIFIÉ'}`, results.mongodb ? 'green' : 'yellow');

  const allPassed = results.backend && results.frontend;
  
  if (allPassed) {
    log('\n🎉 Tous les tests sont passés !', 'green');
    log('\n📝 URLs disponibles:', 'cyan');
    log(`  Frontend: http://localhost:${FRONTEND_PORT}`, 'cyan');
    log(`  Backend:  http://localhost:${BACKEND_PORT}`, 'cyan');
    log(`  Swagger:  http://localhost:${BACKEND_PORT}/api/docs`, 'cyan');
    log('\n💡 Pour tester Google Auth:', 'yellow');
    log('  1. Allez sur http://localhost/signin', 'cyan');
    log('  2. Le bouton Google devrait apparaître', 'cyan');
    log('  3. Ouvrez la console (F12) pour voir les logs', 'cyan');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.', 'yellow');
  }

  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

