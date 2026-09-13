import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Logo } from './logo';
describe('Logo', () => {
  it('links to home with an accessible name', () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /ResuMind AI home/i })).toHaveAttribute('href', '/');
  });
});
