module.exports = {
  disableEmoji: false,
  format: '{type}{scope}: {emoji}{subject}',
  list: [
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
  maxMessageLength: 64,
  messages: {
    body: 'Provide a LONGER description of the change:\n',
    breaking: 'List any BREAKING changes:\n',
    confirmCommit: 'Are you sure you want to proceed with the commit above:\n',
    customScope: 'Denote the SCOPE of this change (optional):\n',
    footer: 'Issues this commit closes, e.g #123, #124:\n',
    subject: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
    type: "Select the type of change that you're committing:\n",
  },
  minMessageLength: 3,
  questions: ['type', 'scope', 'subject', 'body', 'breaking', 'issues'],
  scopes: ['proj', 'module', 'comps', 'store', 'utils'],
  types: {
    build: {
      description: 'Changes that affect the build system or external dependencies',
      emoji: '📦️',
      value: 'build',
    },
    chore: {
      description: 'Build process or auxiliary tool changes',
      emoji: '🤖', // 当前类型的commit所显示的表情
      value: 'chore',
    },
    ci: {
      description: 'CI related changes',
      emoji: '🎡',
      value: 'ci',
    },
    docs: {
      description: 'Documentation only changes',
      emoji: '📝',
      value: 'docs',
    },
    feat: {
      description: 'A new feature',
      emoji: '✨',
      value: 'feat',
    },
    fix: {
      description: 'A bug fix',
      emoji: '🐛',
      value: 'fix',
    },
    perf: {
      description: 'A code change that improves performance',
      emoji: '⚡️',
      value: 'perf',
    },
    refactor: {
      description: 'A code change that neither fixes a bug or adds a feature',
      emoji: '♻️',
      value: 'refactor',
    },
    release: {
      description: 'Create a release commit',
      emoji: '🏹',
      value: 'release',
    },
    revert: {
      description: 'Reverts a previous commit',
      emoji: '⏪️',
      value: 'revert',
    },
    style: {
      description: 'Markup, white-space, formatting, missing semi-colons...',
      emoji: '💄',
      value: 'style',
    },
    test: {
      description: 'Adding missing tests',
      emoji: '✅',
      value: 'test',
    },
  },
};
