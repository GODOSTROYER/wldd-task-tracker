'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  password: string;
}

const rules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One special character (!@#$%...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export function PasswordRequirements({ password }: Props) {
  if (!password) return null;

  return (
    <ul className="space-y-1.5 mt-2">
      {rules.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-2 text-xs transition-colors ${
              passed ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

/** Returns true when all rules pass */
export function isPasswordValid(password: string): boolean {
  return rules.every((r) => r.test(password));
}
