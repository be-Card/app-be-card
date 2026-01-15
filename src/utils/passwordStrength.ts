export type PasswordRequirementKey = 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

export const PASSWORD_REQUIREMENTS: Array<{
  key: PasswordRequirementKey;
  label: string;
  test: (password: string) => boolean;
}> = [
  { key: 'length', label: 'Al menos 8 caracteres', test: (p) => p.length >= 8 },
  { key: 'uppercase', label: 'Al menos 1 letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos 1 letra minúscula', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'Al menos 1 número', test: (p) => /\d/.test(p) },
  {
    key: 'special',
    label: 'Al menos 1 carácter especial (!@#$%^&*(),.?":{}|<>)',
    test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
];

export const evaluatePassword = (password: string) => {
  const results = PASSWORD_REQUIREMENTS.map((req) => ({
    key: req.key,
    label: req.label,
    passed: req.test(password),
  }));

  const passedCount = results.filter((r) => r.passed).length;

  const level: PasswordStrengthLevel =
    passedCount >= 5 ? 'strong' : passedCount >= 3 ? 'medium' : 'weak';

  return {
    passedCount,
    total: results.length,
    level,
    requirements: results,
    isValid: passedCount === results.length,
  };
};

