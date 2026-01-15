import { describe, it, expect } from 'vitest';
import { evaluatePassword } from '../passwordStrength';

describe('evaluatePassword', () => {
  it('marca débil si no cumple requisitos', () => {
    const res = evaluatePassword('abc');
    expect(res.level).toBe('weak');
    expect(res.isValid).toBe(false);
  });

  it('marca media si cumple parcialmente', () => {
    const res = evaluatePassword('Abcdefgh');
    expect(res.level).toBe('medium');
    expect(res.isValid).toBe(false);
  });

  it('marca fuerte si cumple todos los requisitos', () => {
    const res = evaluatePassword('Abcdefg1!');
    expect(res.level).toBe('strong');
    expect(res.isValid).toBe(true);
  });
});

