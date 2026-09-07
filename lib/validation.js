// Centralized validation so every route enforces the same rules the
// User schema expects, with clear error messages returned before we
// ever touch the database or bcrypt.

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export function validateSignupInput({ name, username, email, password }) {
  const errors = {};

  if (typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Name is required";
  } else if (name.trim().length > 50) {
    errors.name = "Name must be 50 characters or fewer";
  }

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    errors.username =
      "Username must be 3-30 characters and contain only letters, numbers, underscores, or periods";
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (typeof password !== "string") {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  } else if (password.length > 72) {
    // bcrypt truncates at 72 bytes; anything past that is silently
    // ignored during hashing and also makes an easy DoS lever, so we
    // reject early with a clear message instead of letting it through.
    errors.password = "Password must be 72 characters or fewer";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLoginInput({ identifier, password }) {
  const errors = {};

  if (typeof identifier !== "string" || identifier.trim().length === 0) {
    errors.identifier = "Enter your username or email";
  }

  if (typeof password !== "string" || password.length === 0) {
    errors.password = "Enter your password";
  } else if (password.length > 72) {
    errors.password = "Invalid password";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function isValidObjectIdLike(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}
