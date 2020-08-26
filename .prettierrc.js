module.exports = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2,
  overrides: [
    {
        files: ['secrets.json'],
        options: {
            tabWidth: 4,
            useTabs: true,
        },
    },
    {
          files: ['*.js', '*.ts', '*.jsx', '*.tsx'],
          options: {
              tabWidth: 4,
          },
      },
  ],
};
