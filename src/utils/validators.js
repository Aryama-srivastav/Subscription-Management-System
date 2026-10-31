export function validatePassword(pw) {
  if (!pw || pw.length <= 8) return 'Password must be more than 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password needs an uppercase letter.';
  if (!/[a-z]/.test(pw)) return 'Password needs a lowercase letter.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password needs a special character.';
  return null;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Enter a valid email.';
}

export function required(value, label = 'This field') {
  return value === null || value === undefined || String(value).trim() === ''
    ? `${label} is required.`
    : null;
}
