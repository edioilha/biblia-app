import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Política da regra de dependência: a camada `de` só pode importar as camadas `para`. */
function camada(de, para) {
  return {
    from: { element: { type: de } },
    allow: { to: para.map((tipo) => ({ element: { type: tipo } })) },
    message: `Camada "${de}" só pode importar: ${para.join(', ')} (ver docs/06 §4).`,
  };
}

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'dev-dist'] },

  // Base para todo o código TypeScript
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict, ...tseslint.configs.stylistic],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },

  // React (camada de UI)
  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    extends: [jsxA11y.flatConfigs.recommended],
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Regra de dependência da Arquitetura Hexagonal (ADR 0006 · docs/06 §4)
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'dominio', pattern: 'src/dominio' },
        { type: 'aplicacao', pattern: 'src/aplicacao' },
        { type: 'infraestrutura', pattern: 'src/infraestrutura' },
        { type: 'ui', pattern: 'src/ui' },
      ],
      'import/resolver': { typescript: true, node: true },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkAllOrigins: true,
          // Arquivos da raiz de src/ (main.tsx, container.ts = Composition Root) não pertencem a
          // nenhuma camada: as camadas não podem importá-los.
          checkUnknownLocals: true,
          policies: [
            camada('dominio', ['dominio']),
            camada('aplicacao', ['dominio', 'aplicacao']),
            camada('infraestrutura', ['dominio', 'aplicacao', 'infraestrutura']),
            camada('ui', ['dominio', 'aplicacao', 'ui']),
            // Bibliotecas externas e módulos do Node: liberados para todas as camadas...
            {
              from: { element: { type: '*' } },
              allow: { to: { module: { origin: ['external', 'core'] } } },
            },
            // ...exceto para o domínio, que deve ser TypeScript puro.
            {
              from: { element: { type: 'dominio' } },
              disallow: { to: { module: { origin: ['external', 'core'] } } },
              message: 'O domínio não pode depender de bibliotecas externas (ADR 0006).',
            },
          ],
        },
      ],
    },
  },

  // Arquivos de configuração (Node)
  {
    files: ['*.config.{js,ts}', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  prettier,
);
