export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email é obrigatório" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail.length < 5 || trimmedEmail.length > 100) {
    return { valid: false, error: "Email deve ter entre 5 e 100 caracteres" };
  }

  const validEmailPattern = /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!validEmailPattern.test(trimmedEmail)) {
    return {
      valid: false,
      error:
        "Email deve conter apenas letras minúsculas, números, ponto, hífen, underscore e um @ seguido de domínio válido",
    };
  }

  const [localPart, domainPart] = trimmedEmail.split("@");

  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return { valid: false, error: "Parte local do email inválida" };
  }

  if (!domainPart || domainPart.length < 3) {
    return { valid: false, error: "Domínio do email inválido" };
  }

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return {
      valid: false,
      error: "Email não pode começar ou terminar com ponto",
    };
  }

  if (localPart.includes("..")) {
    return { valid: false, error: "Email não pode conter pontos consecutivos" };
  }

  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Nome é obrigatório" };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return { valid: false, error: "Nome deve ter entre 2 e 100 caracteres" };
  }

  const validNamePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
  if (!validNamePattern.test(trimmedName)) {
    return {
      valid: false,
      error:
        "Nome deve conter apenas letras, espaços, apóstrofos e hífens em posições válidas",
    };
  }

  if (trimmedName.includes("  ")) {
    return { valid: false, error: "Nome não pode conter espaços múltiplos" };
  }

  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Senha é obrigatória" };
  }

  if (password.length < 8 || password.length > 128) {
    return {
      valid: false,
      error: "Senha deve ter entre 8 e 128 caracteres",
    };
  }

  const validPasswordPattern = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/;
  if (!validPasswordPattern.test(password)) {
    return {
      valid: false,
      error:
        "Senha deve conter apenas letras (A-Z, a-z), números (0-9) e símbolos permitidos (!@#$%^&*()_+-=[]{}|;:,.<>?)",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase) {
    return {
      valid: false,
      error: "Senha deve conter pelo menos uma letra maiúscula (A-Z)",
    };
  }

  if (!hasLowerCase) {
    return {
      valid: false,
      error: "Senha deve conter pelo menos uma letra minúscula (a-z)",
    };
  }

  if (!hasNumber) {
    return {
      valid: false,
      error: "Senha deve conter pelo menos um número (0-9)",
    };
  }

  return { valid: true };
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
