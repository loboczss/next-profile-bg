type BcryptModule = typeof import("bcryptjs");

let bcryptPromise: Promise<BcryptModule> | undefined;

async function loadBcrypt(): Promise<BcryptModule> {
  if (!bcryptPromise) {
    bcryptPromise = import("bcryptjs");
  }
  return bcryptPromise;
}

export async function hashPassword(password: string) {
  const bcrypt = await loadBcrypt();
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  const bcrypt = await loadBcrypt();
  return bcrypt.compare(password, hash);
}
