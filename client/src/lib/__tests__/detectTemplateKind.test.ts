import { detectTemplateKind } from '../templates';

const testCases: { prompt: string; expected: string }[] = [
  {
    prompt: 'todo app for a remote team to track product backlog items',
    expected: 'todo',
  },
  {
    prompt: 'build me an online store to sell sneakers',
    expected: 'ecommerce',
  },
  {
    prompt: 'analytics dashboard for tracking KPIs',
    expected: 'dashboard',
  },
  {
    prompt: 'personal portfolio site for a photographer',
    expected: 'portfolio',
  },
  {
    prompt: 'customer support chat widget',
    expected: 'chat',
  },
  {
    prompt: 'sales pipeline tracker for my team',
    expected: 'crm',
  },
];

let passed = 0;
let failed = 0;

for (const { prompt, expected } of testCases) {
  const result = detectTemplateKind(prompt);
  if (result === expected) {
    console.log(`✓ "${prompt}" → '${result}'`);
    passed++;
  } else {
    console.error(`✗ "${prompt}" → '${result}' (expected '${expected}')`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
