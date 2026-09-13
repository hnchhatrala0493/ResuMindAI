import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, {
  files: ['src/**/*.ts'],
  languageOptions: { parserOptions: { project: './tsconfig.json' } },
});
