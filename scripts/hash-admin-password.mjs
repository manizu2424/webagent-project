import { argon2id, hash } from "argon2";

const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("ADMIN_PASSWORD is required.");
  process.exitCode = 1;
} else if (password.length < 12 || password.length > 256) {
  console.error("ADMIN_PASSWORD must be between 12 and 256 characters.");
  process.exitCode = 1;
} else {
  const passwordHash = await hash(password, {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  console.log(passwordHash);
}
