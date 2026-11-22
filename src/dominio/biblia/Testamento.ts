export const Testamento = {
  ANTIGO: 'ANTIGO',
  NOVO: 'NOVO',
} as const;

export type Testamento = (typeof Testamento)[keyof typeof Testamento];
