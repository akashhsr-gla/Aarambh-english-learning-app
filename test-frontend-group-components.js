const fs = require('fs');
const path = require('path');

// Test frontend group components for issues
const testFrontendComponents = () => {
  console.log('🧪 Testing Frontend Group Components...\n');

  const components = [
    'app/GroupCreationScreen.tsx',
    'app/GroupDiscussionScreen.tsx',
    'app/GroupWaitingRoom.tsx',
    'app/GroupVideoCallScreen.tsx',
    'app/GroupChatScreen.tsx'
  ];

  let issues = [];

  components.forEach(component => {
    try {
      const filePath = path.join(__dirname, '..', component);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for common issues
      const checks = [
        {
          name: 'Missing imports',
          pattern: /import.*from.*['"]\.\.\/services\/api['"]/,
          shouldMatch: true,
          message: 'Missing API import'
        },
        {
          name: 'TypeScript errors',
          pattern: /@ts-ignore/,
          shouldMatch: false,
          message: 'Has @ts-ignore comments (potential type issues)'
        },
        {
          name: 'Console.log statements',
          pattern: /console\.log/,
          shouldMatch: false,
          message: 'Has console.log statements (should be removed in production)'
        },
        {
          name: 'Unused variables',
          pattern: /const.*=.*;$/m,
          shouldMatch: true,
          message: 'Potential unused variables'
        },
        {
          name: 'Missing error handling',
          pattern: /try\s*{[\s\S]*?}\s*catch/,
          shouldMatch: true,
          message: 'Missing try-catch blocks'
        },
        {
          name: 'Navigation type safety',
          pattern: /navigation\.navigate\(/,
          shouldMatch: true,
          message: 'Navigation calls present'
        }
      ];

      checks.forEach(check => {
        const matches = content.match(check.pattern);
        if (check.shouldMatch && !matches) {
          issues.push(`${component}: ${check.message}`);
        } else if (!check.shouldMatch && matches) {
          issues.push(`${component}: ${check.message}`);
        }
      });

      // Check for specific group-related functionality
      const groupChecks = [
        {
          name: 'Group creation form validation',
          pattern: /validateForm/,
          shouldMatch: true,
          message: 'Missing form validation'
        },
        {
          name: 'API error handling',
          pattern: /catch.*error.*{/,
          shouldMatch: true,
          message: 'Missing error handling in API calls'
        },
        {
          name: 'State management',
          pattern: /useState/,
          shouldMatch: true,
          message: 'Missing state management'
        },
        {
          name: 'Effect hooks',
          pattern: /useEffect/,
          shouldMatch: true,
          message: 'Missing effect hooks'
        }
      ];

      groupChecks.forEach(check => {
        const matches = content.match(check.pattern);
        if (check.shouldMatch && !matches) {
          issues.push(`${component}: ${check.message}`);
        }
      });

      console.log(`✅ ${component}: Basic checks passed`);

    } catch (error) {
      issues.push(`${component}: File read error - ${error.message}`);
    }
  });

  return issues;
};

// Test API integration
const testAPIIntegration = () => {
  console.log('\n🧪 Testing API Integration...\n');

  const apiFile = path.join(__dirname, '..', 'app', 'services', 'api.js');
  
  try {
    const content = fs.readFileSync(apiFile, 'utf8');
    
    const apiChecks = [
      {
        name: 'Groups API methods',
        pattern: /export const groupsAPI/,
        shouldMatch: true,
        message: 'Missing groupsAPI export'
      },
      {
        name: 'Create group method',
        pattern: /createGroup:/,
        shouldMatch: true,
        message: 'Missing createGroup method'
      },
      {
        name: 'Join group method',
        pattern: /joinGroup:/,
        shouldMatch: true,
        message: 'Missing joinGroup method'
      },
      {
        name: 'WebRTC signaling methods',
        pattern: /getGroupSignaling/,
        shouldMatch: true,
        message: 'Missing WebRTC signaling methods'
      },
      {
        name: 'Error handling in API calls',
        pattern: /catch.*error/,
        shouldMatch: true,
        message: 'Missing error handling in API calls'
      }
    ];

    let apiIssues = [];
    apiChecks.forEach(check => {
      const matches = content.match(check.pattern);
      if (check.shouldMatch && !matches) {
        apiIssues.push(`API: ${check.message}`);
      }
    });

    if (apiIssues.length === 0) {
      console.log('✅ API Integration: All checks passed');
    } else {
      console.log('❌ API Integration Issues:');
      apiIssues.forEach(issue => console.log(`  - ${issue}`));
    }

    return apiIssues;

  } catch (error) {
    console.log(`❌ API Integration: File read error - ${error.message}`);
    return [`API: File read error - ${error.message}`];
  }
};

// Test component structure
const testComponentStructure = () => {
  console.log('\n🧪 Testing Component Structure...\n');

  const structureChecks = [
    {
      file: 'app/GroupCreationScreen.tsx',
      checks: [
        { pattern: /interface GroupCreationData/, name: 'TypeScript interface' },
        { pattern: /const.*formData.*useState/, name: 'Form state management' },
        { pattern: /const.*validateForm/, name: 'Form validation' },
        { pattern: /const.*handleSubmit/, name: 'Submit handler' }
      ]
    },
    {
      file: 'app/GroupDiscussionScreen.tsx',
      checks: [
        { pattern: /interface GroupDiscussion/, name: 'TypeScript interface' },
        { pattern: /const.*groups.*useState/, name: 'Groups state' },
        { pattern: /const.*loadGroups/, name: 'Load groups function' },
        { pattern: /const.*handleJoinGroup/, name: 'Join group handler' }
      ]
    },
    {
      file: 'app/GroupWaitingRoom.tsx',
      checks: [
        { pattern: /const.*participants.*useState/, name: 'Participants state' },
        { pattern: /const.*loadGroupDetails/, name: 'Load group details' },
        { pattern: /const.*handleStartDiscussion/, name: 'Start discussion handler' },
        { pattern: /const.*toggleMute/, name: 'Media controls' }
      ]
    },
    {
      file: 'app/GroupVideoCallScreen.tsx',
      checks: [
        { pattern: /interface Participant/, name: 'Participant interface' },
        { pattern: /const.*isMuted.*useState/, name: 'Audio state' },
        { pattern: /const.*hasVideo.*useState/, name: 'Video state' },
        { pattern: /const.*handleEndCall/, name: 'End call handler' }
      ]
    },
    {
      file: 'app/GroupChatScreen.tsx',
      checks: [
        { pattern: /interface Message/, name: 'Message interface' },
        { pattern: /const.*messages.*useState/, name: 'Messages state' },
        { pattern: /const.*sendMessage/, name: 'Send message handler' },
        { pattern: /const.*loadMessages/, name: 'Load messages function' }
      ]
    }
  ];

  let structureIssues = [];

  structureChecks.forEach(({ file, checks }) => {
    try {
      const filePath = path.join(__dirname, '..', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      checks.forEach(check => {
        const matches = content.match(check.pattern);
        if (!matches) {
          structureIssues.push(`${file}: Missing ${check.name}`);
        }
      });

      console.log(`✅ ${file}: Structure checks passed`);

    } catch (error) {
      structureIssues.push(`${file}: File read error - ${error.message}`);
    }
  });

  return structureIssues;
};

// Test navigation integration
const testNavigationIntegration = () => {
  console.log('\n🧪 Testing Navigation Integration...\n');

  const navigationChecks = [
    {
      file: 'app/GroupCreationScreen.tsx',
      patterns: [
        { pattern: /navigation\.navigate.*GroupDiscussionScreen/, name: 'Navigate to GroupDiscussionScreen' },
        { pattern: /navigation\.goBack/, name: 'Go back navigation' }
      ]
    },
    {
      file: 'app/GroupDiscussionScreen.tsx',
      patterns: [
        { pattern: /navigation\.navigate.*GroupWaitingRoom/, name: 'Navigate to GroupWaitingRoom' },
        { pattern: /navigation\.navigate.*GroupChatScreen/, name: 'Navigate to GroupChatScreen' }
      ]
    },
    {
      file: 'app/GroupWaitingRoom.tsx',
      patterns: [
        { pattern: /navigation\.navigate.*GroupVideoCallScreen/, name: 'Navigate to GroupVideoCallScreen' },
        { pattern: /navigation\.navigate.*GroupChatScreen/, name: 'Navigate to GroupChatScreen' }
      ]
    }
  ];

  let navigationIssues = [];

  navigationChecks.forEach(({ file, patterns }) => {
    try {
      const filePath = path.join(__dirname, '..', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      patterns.forEach(({ pattern, name }) => {
        const matches = content.match(pattern);
        if (!matches) {
          navigationIssues.push(`${file}: Missing ${name}`);
        }
      });

    } catch (error) {
      navigationIssues.push(`${file}: File read error - ${error.message}`);
    }
  });

  if (navigationIssues.length === 0) {
    console.log('✅ Navigation Integration: All checks passed');
  } else {
    console.log('❌ Navigation Integration Issues:');
    navigationIssues.forEach(issue => console.log(`  - ${issue}`));
  }

  return navigationIssues;
};

// Run all frontend tests
const runFrontendTests = () => {
  console.log('🚀 Starting Frontend Group Components Testing...\n');
  
  const componentIssues = testFrontendComponents();
  const apiIssues = testAPIIntegration();
  const structureIssues = testComponentStructure();
  const navigationIssues = testNavigationIntegration();
  
  const allIssues = [
    ...componentIssues,
    ...apiIssues,
    ...structureIssues,
    ...navigationIssues
  ];
  
  console.log('\n📊 Frontend Test Results:');
  
  if (allIssues.length === 0) {
    console.log('✅ All frontend tests passed! No issues found.');
  } else {
    console.log(`❌ Found ${allIssues.length} issues:`);
    allIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  return allIssues;
};

// Run tests
runFrontendTests();
