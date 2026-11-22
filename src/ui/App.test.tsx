import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Canon } from '../dominio/biblia';
import { App } from './App';
import { DependenciasProvider } from './contexto/Dependencias';

describe('App', () => {
  it('exibe o título e o resumo do cânon', () => {
    render(
      <DependenciasProvider valor={{ canon: new Canon() }}>
        <App />
      </DependenciasProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Bíblia App' })).toBeInTheDocument();
    expect(screen.getByText('66 livros · 1189 capítulos')).toBeInTheDocument();
  });
});
