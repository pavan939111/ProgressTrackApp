export function validateEmail(email: string): boolean {
  return typeof email === 'string' && email.includes('@') && email.includes('.');
}

export function validateRequiredString(val: any, fieldName: string): { valid: boolean; error?: string } {
  if (!val || typeof val !== 'string' || !val.trim()) {
    return { valid: false, error: `${fieldName} is required and must be a non-empty string.` };
  }
  return { valid: true };
}

export function validatePriority(priority: any): boolean {
  return ['High', 'Medium', 'Low'].includes(priority);
}

export function validateSessionName(name: any): boolean {
  return ['Morning', 'Before Lunch', 'Afternoon', 'Evening', 'Night'].includes(name);
}
