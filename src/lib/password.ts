// Password validation and strength checking
const COMMON_PASSWORDS = [
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "master",
  "dragon", "login", "princess", "football", "shadow", "sunshine", "trustno1",
  "iloveyou", "batman", "access", "hello", "charlie", "password1", "admin",
  "admin123", "letmein", "welcome", "1234", "12345", "123456789", "1234567",
];

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function checkPasswordStrength(password: string): {
  score: number;
  level: PasswordStrength;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Minimum 8 characters");

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else feedback.push("Mix uppercase and lowercase");

  if (/\d/.test(password)) score += 1;
  else feedback.push("Add numbers");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("Add special characters");

  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = 0;
    feedback.length = 0;
    feedback.push("This password is too common");
  }

  const level: PasswordStrength = score <= 1 ? "weak" : score <= 2 ? "fair" : score <= 3 ? "good" : "strong";

  return { score, level, feedback };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, error: "This password is too common. Please choose a stronger one." };
  }
  return { valid: true };
}