export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * 🔌 Port — Domain/Application never imports bcrypt directly.
 * Implemented by Infrastructure (BcryptPasswordHasher), so the hashing
 * algorithm can be swapped (e.g. to argon2) without touching use cases.
 */
export interface IPasswordHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
