const fs = require('fs');
const path = require('path');

// Test frontend feature integration
const testFrontendFeatureIntegration = () => {
  console.log('🧪 Testing Frontend Feature Integration...\n');

  const components = [
    'app/GroupCreationScreen.tsx',
    'app/GroupDiscussionScreen.tsx',
    'app/GroupWaitingRoom.tsx',
    'app/GroupVideoCallScreen.tsx',
    'app/GroupChatScreen.tsx'
  ];

  let issues = [];
  let passed = 0;

  components.forEach(component => {
    try {
      const filePath = path.join(__dirname, '..', component);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔍 Testing ${component}:`);
      
      // Check for feature access integration
      const hasFeatureAccess = content.includes('useFeatureAccess');
      const hasFeatureWrapper = content.includes('FeatureAccessWrapper');
      const hasFeatureService = content.includes('featureService');
      
      if (hasFeatureAccess) {
        console.log(`  ✅ useFeatureAccess hook imported`);
        passed++;
      } else {
        console.log(`  ❌ useFeatureAccess hook not found`);
        issues.push(`${component}: Missing useFeatureAccess hook`);
      }
      
      if (hasFeatureWrapper) {
        console.log(`  ✅ FeatureAccessWrapper component used`);
        passed++;
      } else {
        console.log(`  ⚠️  FeatureAccessWrapper not used (may be intentional)`);
      }
      
      if (hasFeatureService) {
        console.log(`  ✅ featureService imported`);
        passed++;
      } else {
        console.log(`  ⚠️  featureService not imported (may use hooks instead)`);
      }
      
      // Check for proper feature key usage
      const featureKeys = content.match(/featureKey:\s*['"`]([^'"`]+)['"`]/g);
      if (featureKeys) {
        console.log(`  ✅ Feature keys found: ${featureKeys.map(k => k.match(/['"`]([^'"`]+)['"`]/)[1]).join(', ')}`);
        passed++;
      }
      
      console.log('');
      
    } catch (error) {
      issues.push(`${component}: File read error - ${error.message}`);
    }
  });

  return { issues, passed };
};

// Test feature service implementation
const testFeatureService = () => {
  console.log('🧪 Testing Feature Service Implementation...\n');

  try {
    const servicePath = path.join(__dirname, '..', 'app', 'services', 'featureService.js');
    const content = fs.readFileSync(servicePath, 'utf8');
    
    const checks = [
      { name: 'Class definition', pattern: /class FeatureService/, shouldMatch: true },
      { name: 'loadFeatures method', pattern: /loadFeatures\s*\(/, shouldMatch: true },
      { name: 'canAccess method', pattern: /canAccess\s*\(/, shouldMatch: true },
      { name: 'getFeatureInfo method', pattern: /getFeatureInfo\s*\(/, shouldMatch: true },
      { name: 'recordUsage method', pattern: /recordUsage\s*\(/, shouldMatch: true },
      { name: 'Singleton export', pattern: /export default featureService/, shouldMatch: true },
      { name: 'API integration', pattern: /apiRequest/, shouldMatch: true },
      { name: 'Error handling', pattern: /catch.*error/, shouldMatch: true }
    ];

    let servicePassed = 0;
    let serviceIssues = [];

    checks.forEach(check => {
      const matches = content.match(check.pattern);
      if (check.shouldMatch && matches) {
        console.log(`  ✅ ${check.name}: Found`);
        servicePassed++;
      } else if (check.shouldMatch && !matches) {
        console.log(`  ❌ ${check.name}: Missing`);
        serviceIssues.push(`FeatureService: Missing ${check.name}`);
      } else if (!check.shouldMatch && matches) {
        console.log(`  ⚠️  ${check.name}: Found (unexpected)`);
      }
    });

    console.log(`\n📊 Feature Service: ${servicePassed}/${checks.length} checks passed`);
    return { issues: serviceIssues, passed: servicePassed };

  } catch (error) {
    console.log(`❌ Feature Service: File read error - ${error.message}`);
    return { issues: [`FeatureService: File read error - ${error.message}`], passed: 0 };
  }
};

// Test React hooks implementation
const testReactHooks = () => {
  console.log('🧪 Testing React Hooks Implementation...\n');

  try {
    const hooksPath = path.join(__dirname, '..', 'app', 'hooks', 'useFeatureAccess.js');
    const content = fs.readFileSync(hooksPath, 'utf8');
    
    const checks = [
      { name: 'useFeatureAccess hook', pattern: /export const useFeatureAccess/, shouldMatch: true },
      { name: 'useMultipleFeatureAccess hook', pattern: /export const useMultipleFeatureAccess/, shouldMatch: true },
      { name: 'useCategoryFeatures hook', pattern: /export const useCategoryFeatures/, shouldMatch: true },
      { name: 'useSubscriptionInfo hook', pattern: /export const useSubscriptionInfo/, shouldMatch: true },
      { name: 'useFeatureStats hook', pattern: /export const useFeatureStats/, shouldMatch: true },
      { name: 'useState usage', pattern: /useState/, shouldMatch: true },
      { name: 'useEffect usage', pattern: /useEffect/, shouldMatch: true },
      { name: 'useCallback usage', pattern: /useCallback/, shouldMatch: true },
      { name: 'Error handling', pattern: /catch.*error/, shouldMatch: true }
    ];

    let hooksPassed = 0;
    let hooksIssues = [];

    checks.forEach(check => {
      const matches = content.match(check.pattern);
      if (check.shouldMatch && matches) {
        console.log(`  ✅ ${check.name}: Found`);
        hooksPassed++;
      } else if (check.shouldMatch && !matches) {
        console.log(`  ❌ ${check.name}: Missing`);
        hooksIssues.push(`React Hooks: Missing ${check.name}`);
      }
    });

    console.log(`\n📊 React Hooks: ${hooksPassed}/${checks.length} checks passed`);
    return { issues: hooksIssues, passed: hooksPassed };

  } catch (error) {
    console.log(`❌ React Hooks: File read error - ${error.message}`);
    return { issues: [`React Hooks: File read error - ${error.message}`], passed: 0 };
  }
};

// Test FeatureAccessWrapper component
const testFeatureAccessWrapper = () => {
  console.log('🧪 Testing FeatureAccessWrapper Component...\n');

  try {
    const wrapperPath = path.join(__dirname, '..', 'app', 'components', 'FeatureAccessWrapper.jsx');
    const content = fs.readFileSync(wrapperPath, 'utf8');
    
    const checks = [
      { name: 'Component definition', pattern: /const FeatureAccessWrapper/, shouldMatch: true },
      { name: 'Props destructuring', pattern: /featureKey.*children.*fallback/, shouldMatch: true },
      { name: 'useFeatureAccess hook', pattern: /useFeatureAccess/, shouldMatch: true },
      { name: 'canAccess check', pattern: /canAccess/, shouldMatch: true },
      { name: 'Loading state', pattern: /isLoading/, shouldMatch: true },
      { name: 'Error handling', pattern: /error/, shouldMatch: true },
      { name: 'Upgrade prompt', pattern: /Upgrade/, shouldMatch: true },
      { name: 'Locked UI', pattern: /locked/, shouldMatch: true },
      { name: 'TouchableOpacity', pattern: /TouchableOpacity/, shouldMatch: true },
      { name: 'Alert usage', pattern: /Alert/, shouldMatch: true }
    ];

    let wrapperPassed = 0;
    let wrapperIssues = [];

    checks.forEach(check => {
      const matches = content.match(check.pattern);
      if (check.shouldMatch && matches) {
        console.log(`  ✅ ${check.name}: Found`);
        wrapperPassed++;
      } else if (check.shouldMatch && !matches) {
        console.log(`  ❌ ${check.name}: Missing`);
        wrapperIssues.push(`FeatureAccessWrapper: Missing ${check.name}`);
      }
    });

    console.log(`\n📊 FeatureAccessWrapper: ${wrapperPassed}/${checks.length} checks passed`);
    return { issues: wrapperIssues, passed: wrapperPassed };

  } catch (error) {
    console.log(`❌ FeatureAccessWrapper: File read error - ${error.message}`);
    return { issues: [`FeatureAccessWrapper: File read error - ${error.message}`], passed: 0 };
  }
};

// Test API integration
const testAPIIntegration = () => {
  console.log('🧪 Testing API Integration...\n');

  try {
    const apiPath = path.join(__dirname, '..', 'app', 'services', 'api.js');
    const content = fs.readFileSync(apiPath, 'utf8');
    
    const checks = [
      { name: 'Feature API methods', pattern: /featuresAPI/, shouldMatch: false }, // Should use featureService instead
      { name: 'API request function', pattern: /apiRequest/, shouldMatch: true },
      { name: 'Groups API', pattern: /groupsAPI/, shouldMatch: true },
      { name: 'Error handling', pattern: /catch.*error/, shouldMatch: true }
    ];

    let apiPassed = 0;
    let apiIssues = [];

    checks.forEach(check => {
      const matches = content.match(check.pattern);
      if (check.shouldMatch && matches) {
        console.log(`  ✅ ${check.name}: Found`);
        apiPassed++;
      } else if (!check.shouldMatch && !matches) {
        console.log(`  ✅ ${check.name}: Not found (correct)`);
        apiPassed++;
      } else if (check.shouldMatch && !matches) {
        console.log(`  ❌ ${check.name}: Missing`);
        apiIssues.push(`API: Missing ${check.name}`);
      } else {
        console.log(`  ⚠️  ${check.name}: Found (unexpected)`);
        apiIssues.push(`API: Unexpected ${check.name}`);
      }
    });

    console.log(`\n📊 API Integration: ${apiPassed}/${checks.length} checks passed`);
    return { issues: apiIssues, passed: apiPassed };

  } catch (error) {
    console.log(`❌ API Integration: File read error - ${error.message}`);
    return { issues: [`API: File read error - ${error.message}`], passed: 0 };
  }
};

// Test TypeScript integration
const testTypeScriptIntegration = () => {
  console.log('🧪 Testing TypeScript Integration...\n');

  const tsFiles = [
    'app/GroupCreationScreen.tsx',
    'app/GroupDiscussionScreen.tsx',
    'app/GroupWaitingRoom.tsx',
    'app/GroupVideoCallScreen.tsx',
    'app/GroupChatScreen.tsx',
    'app/hooks/useFeatureAccess.js',
    'app/services/featureService.js',
    'app/components/FeatureAccessWrapper.jsx'
  ];

  let tsPassed = 0;
  let tsIssues = [];

  tsFiles.forEach(file => {
    try {
      const filePath = path.join(__dirname, '..', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const isTsx = file.endsWith('.tsx');
      const isJs = file.endsWith('.js');
      
      if (isTsx) {
        // Check for TypeScript features
        const hasInterfaces = content.includes('interface ');
        const hasTypes = content.includes(': ');
        const hasGenericTypes = content.includes('<');
        
        if (hasInterfaces || hasTypes || hasGenericTypes) {
          console.log(`  ✅ ${file}: TypeScript features found`);
          tsPassed++;
        } else {
          console.log(`  ⚠️  ${file}: Limited TypeScript usage`);
        }
      } else if (isJs) {
        // Check for proper JS patterns
        const hasExports = content.includes('export ');
        const hasImports = content.includes('import ');
        
        if (hasExports && hasImports) {
          console.log(`  ✅ ${file}: Proper ES6 modules`);
          tsPassed++;
        } else {
          console.log(`  ⚠️  ${file}: Limited ES6 module usage`);
        }
      }
      
    } catch (error) {
      tsIssues.push(`${file}: File read error - ${error.message}`);
    }
  });

  console.log(`\n📊 TypeScript Integration: ${tsPassed}/${tsFiles.length} files checked`);
  return { issues: tsIssues, passed: tsPassed };
};

// Run all frontend tests
const runFrontendFeatureTests = () => {
  console.log('🚀 Starting Frontend Feature Integration Testing...\n');
  
  const tests = [
    { name: 'Frontend Feature Integration', fn: testFrontendFeatureIntegration },
    { name: 'Feature Service', fn: testFeatureService },
    { name: 'React Hooks', fn: testReactHooks },
    { name: 'FeatureAccessWrapper', fn: testFeatureAccessWrapper },
    { name: 'API Integration', fn: testAPIIntegration },
    { name: 'TypeScript Integration', fn: testTypeScriptIntegration }
  ];
  
  let totalPassed = 0;
  let totalIssues = [];
  
  tests.forEach(test => {
    try {
      const result = test.fn();
      totalPassed += result.passed;
      totalIssues = totalIssues.concat(result.issues);
    } catch (error) {
      totalIssues.push(`${test.name}: Test failed - ${error.message}`);
    }
  });
  
  console.log('\n📊 Frontend Feature Integration Test Results:');
  console.log(`✅ Total Checks Passed: ${totalPassed}`);
  console.log(`❌ Total Issues: ${totalIssues.length}`);
  
  if (totalIssues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    totalIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (totalIssues.length === 0) {
    console.log('\n🎉 All frontend feature integration tests passed!');
  } else {
    console.log('\n⚠️  Some issues found. Please review the issues above.');
  }
  
  return { passed: totalPassed, issues: totalIssues };
};

// Run tests
runFrontendFeatureTests();
