import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';
import { formatMoney, referenceId } from '@/lib/format';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('resolves conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('format', () => {
  it('formats minor units as currency with the ISO code', () => {
    expect(formatMoney(125_000_000, 'KES')).toContain('KES');
  });

  it('builds a Lenzro reference id', () => {
    expect(referenceId('BKG', 42, 2026)).toBe('LNZ-BKG-2026-0042');
  });
});

describe('<Button />', () => {
  it('renders its label as an accessible button', () => {
    render(<Button>Book now</Button>);
    expect(screen.getByRole('button', { name: 'Book now' })).toBeInTheDocument();
  });
});
