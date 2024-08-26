/**
 * Commitlint Config
 */
const commitlintConfig = {
  extends: ['@commitlint/config-conventional'],
  plugins: ['commitlint-plugin-function-rules'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'style',
        'chore',
        'perf',
        'refactor',
        'docs',
        'test',
        'revert',
        'build',
        'ci',
        'release',
      ],
    ],
  },
};

module.exports = commitlintConfig;
