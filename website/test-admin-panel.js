const fs = require('fs');
const path = require('path');

// Test admin panel implementation
const testAdminPanel = () => {
  console.log('🧪 Testing Admin Panel Implementation...\n');

  const adminFiles = [
    'app/admin/login/page.tsx',
    'app/admin/layout.tsx',
    'app/admin/dashboard/page.tsx',
    'app/admin/games/page.tsx',
    'app/admin/users/page.tsx',
    'app/admin/payments/page.tsx',
    'app/admin/sessions/page.tsx',
    'app/admin/analytics/page.tsx',
    'app/admin/settings/page.tsx',
    'app/admin/page.tsx',
    'app/api/admin/auth/login/route.ts'
  ];

  let passed = 0;
  let failed = 0;
  let issues = [];

  adminFiles.forEach(file => {
    try {
      const filePath = path.join(__dirname, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔍 Testing ${file}:`);
      
      // Check for React components
      const hasReactImport = content.includes('import React') || content.includes('from \'react\'');
      const hasNextImport = content.includes('from \'next/');
      const hasLucideIcons = content.includes('from \'lucide-react\'');
      
      if (hasReactImport) {
        console.log(`  ✅ React imports found`);
        passed++;
      } else {
        console.log(`  ❌ React imports missing`);
        failed++;
        issues.push(`${file}: Missing React imports`);
      }
      
      if (hasNextImport) {
        console.log(`  ✅ Next.js imports found`);
        passed++;
      } else if (file.includes('page.tsx') || file.includes('layout.tsx')) {
        console.log(`  ⚠️  Next.js imports missing (may be intentional)`);
      }
      
      if (hasLucideIcons) {
        console.log(`  ✅ Lucide icons found`);
        passed++;
      } else if (file.includes('page.tsx')) {
        console.log(`  ⚠️  Lucide icons missing (may be intentional)`);
      }
      
      // Check for TypeScript features
      const hasTypeScript = content.includes(': ') && content.includes('interface ');
      if (hasTypeScript) {
        console.log(`  ✅ TypeScript features found`);
        passed++;
      }
      
      // Check for proper component structure
      const hasExportDefault = content.includes('export default');
      if (hasExportDefault) {
        console.log(`  ✅ Default export found`);
        passed++;
      } else {
        console.log(`  ❌ Default export missing`);
        failed++;
        issues.push(`${file}: Missing default export`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${file}: File read error - ${error.message}`);
      failed++;
      issues.push(`${file}: File read error - ${error.message}`);
    }
  });

  return { passed, failed, issues };
};

// Test admin panel features
const testAdminFeatures = () => {
  console.log('🧪 Testing Admin Panel Features...\n');

  const features = [
    {
      name: 'Authentication System',
      file: 'app/admin/login/page.tsx',
      checks: [
        'Login form',
        'Password visibility toggle',
        'Error handling',
        'Demo credentials'
      ]
    },
    {
      name: 'Admin Layout',
      file: 'app/admin/layout.tsx',
      checks: [
        'Sidebar navigation',
        'User info display',
        'Logout functionality',
        'Mobile responsive'
      ]
    },
    {
      name: 'Dashboard',
      file: 'app/admin/dashboard/page.tsx',
      checks: [
        'Statistics cards',
        'Recent activity',
        'Quick actions',
        'Loading states'
      ]
    },
    {
      name: 'Games Management',
      file: 'app/admin/games/page.tsx',
      checks: [
        'Games list',
        'Search and filter',
        'Status toggle',
        'Add/Edit/Delete actions'
      ]
    },
    {
      name: 'User Management',
      file: 'app/admin/users/page.tsx',
      checks: [
        'Users table',
        'Bulk actions',
        'Role management',
        'Status management'
      ]
    },
    {
      name: 'Payment Management',
      file: 'app/admin/payments/page.tsx',
      checks: [
        'Transactions table',
        'Revenue statistics',
        'Payment status',
        'Export functionality'
      ]
    },
    {
      name: 'Session Management',
      file: 'app/admin/sessions/page.tsx',
      checks: [
        'Sessions list',
        'Session types',
        'Status tracking',
        'Duration tracking'
      ]
    },
    {
      name: 'Analytics',
      file: 'app/admin/analytics/page.tsx',
      checks: [
        'Key metrics',
        'Charts placeholder',
        'Popular games',
        'Time range selection'
      ]
    },
    {
      name: 'Settings',
      file: 'app/admin/settings/page.tsx',
      checks: [
        'Tab navigation',
        'Form inputs',
        'Toggle switches',
        'Save functionality'
      ]
    }
  ];

  let featurePassed = 0;
  let featureFailed = 0;
  let featureIssues = [];

  features.forEach(feature => {
    try {
      const filePath = path.join(__dirname, feature.file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔍 Testing ${feature.name}:`);
      
      let checksPassed = 0;
      feature.checks.forEach(check => {
        // Simple keyword checks for each feature
        const hasFeature = content.toLowerCase().includes(check.toLowerCase().replace(/\s+/g, ''));
        if (hasFeature) {
          console.log(`  ✅ ${check}`);
          checksPassed++;
        } else {
          console.log(`  ❌ ${check}`);
          featureIssues.push(`${feature.name}: Missing ${check}`);
        }
      });
      
      if (checksPassed === feature.checks.length) {
        featurePassed++;
        console.log(`  ✅ All checks passed`);
      } else {
        featureFailed++;
        console.log(`  ❌ ${feature.checks.length - checksPassed} checks failed`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${feature.name}: File read error - ${error.message}`);
      featureFailed++;
      featureIssues.push(`${feature.name}: File read error - ${error.message}`);
    }
  });

  return { passed: featurePassed, failed: featureFailed, issues: featureIssues };
};

// Test admin panel navigation
const testAdminNavigation = () => {
  console.log('🧪 Testing Admin Panel Navigation...\n');

  const navigationItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Games Management', path: '/admin/games' },
    { name: 'User Management', path: '/admin/users' },
    { name: 'Payment Management', path: '/admin/payments' },
    { name: 'Session Management', path: '/admin/sessions' },
    { name: 'Analytics', path: '/admin/analytics' },
    { name: 'Settings', path: '/admin/settings' }
  ];

  let navPassed = 0;
  let navFailed = 0;
  let navIssues = [];

  // Check if all navigation items have corresponding pages
  navigationItems.forEach(item => {
    const pagePath = `app/admin${item.path.replace('/admin', '')}/page.tsx`;
    const filePath = path.join(__dirname, pagePath);
    
    try {
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${item.name}: Page exists`);
        navPassed++;
      } else {
        console.log(`❌ ${item.name}: Page missing`);
        navFailed++;
        navIssues.push(`${item.name}: Page file missing`);
      }
    } catch (error) {
      console.log(`❌ ${item.name}: Error checking page - ${error.message}`);
      navFailed++;
      navIssues.push(`${item.name}: Error checking page - ${error.message}`);
    }
  });

  return { passed: navPassed, failed: navFailed, issues: navIssues };
};

// Test admin panel responsiveness
const testAdminResponsiveness = () => {
  console.log('🧪 Testing Admin Panel Responsiveness...\n');

  const responsiveChecks = [
    {
      name: 'Mobile Sidebar',
      file: 'app/admin/layout.tsx',
      patterns: ['lg:hidden', 'md:flex-row', 'flex-col']
    },
    {
      name: 'Responsive Grid',
      file: 'app/admin/dashboard/page.tsx',
      patterns: ['grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4']
    },
    {
      name: 'Responsive Tables',
      file: 'app/admin/users/page.tsx',
      patterns: ['overflow-x-auto', 'min-w-full']
    },
    {
      name: 'Responsive Forms',
      file: 'app/admin/settings/page.tsx',
      patterns: ['lg:flex-row', 'flex-col', 'md:grid-cols-2']
    }
  ];

  let respPassed = 0;
  let respFailed = 0;
  let respIssues = [];

  responsiveChecks.forEach(check => {
    try {
      const filePath = path.join(__dirname, check.file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔍 Testing ${check.name}:`);
      
      let patternsFound = 0;
      check.patterns.forEach(pattern => {
        if (content.includes(pattern)) {
          console.log(`  ✅ ${pattern} found`);
          patternsFound++;
        } else {
          console.log(`  ❌ ${pattern} missing`);
          respIssues.push(`${check.name}: Missing ${pattern}`);
        }
      });
      
      if (patternsFound === check.patterns.length) {
        respPassed++;
        console.log(`  ✅ All responsive patterns found`);
      } else {
        respFailed++;
        console.log(`  ❌ ${check.patterns.length - patternsFound} patterns missing`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${check.name}: File read error - ${error.message}`);
      respFailed++;
      respIssues.push(`${check.name}: File read error - ${error.message}`);
    }
  });

  return { passed: respPassed, failed: respFailed, issues: respIssues };
};

// Run all admin panel tests
const runAdminPanelTests = () => {
  console.log('🚀 Starting Admin Panel Testing...\n');
  
  const tests = [
    { name: 'File Structure', fn: testAdminPanel },
    { name: 'Feature Implementation', fn: testAdminFeatures },
    { name: 'Navigation', fn: testAdminNavigation },
    { name: 'Responsiveness', fn: testAdminResponsiveness }
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  let allIssues = [];
  
  tests.forEach(test => {
    try {
      const result = test.fn();
      totalPassed += result.passed;
      totalFailed += result.failed;
      allIssues = allIssues.concat(result.issues);
    } catch (error) {
      console.log(`❌ ${test.name}: Test failed - ${error.message}`);
      totalFailed++;
    }
  });
  
  console.log('\n📊 Admin Panel Test Results:');
  console.log(`✅ Total Checks Passed: ${totalPassed}`);
  console.log(`❌ Total Checks Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  if (allIssues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    allIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (totalFailed === 0) {
    console.log('\n🎉 All admin panel tests passed! The admin panel is ready for use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  return { passed: totalPassed, failed: totalFailed, issues: allIssues };
};

// Run tests
runAdminPanelTests();
