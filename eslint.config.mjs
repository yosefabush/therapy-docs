import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Flat ESLint config (ESLint v9 / Next.js 16). `next lint` was removed in
// Next 16, so linting runs through the ESLint CLI directly.
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'data/**',
    ],
  },
  ...nextCoreWebVitals,
  {
    // The React Compiler ruleset (eslint-plugin-react-hooks v6) ships several
    // experimental, advisory rules. They flag legitimate patterns (e.g.
    // initializing local state from loaded data in an effect), so we surface
    // them as warnings rather than blocking errors. Established correctness
    // rules such as rules-of-hooks and exhaustive-deps remain errors.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];

export default eslintConfig;
