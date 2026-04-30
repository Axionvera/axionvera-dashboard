import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_STELLAR_NETWORK: z.enum(["testnet", "mainnet", "futurenet"]),
    NEXT_PUBLIC_SOROBAN_RPC_URL: z.string().url(),
    NEXT_PUBLIC_HORIZON_URL: z.string().url(),
    NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID: z
      .string()
      .regex(/^C[A-Z0-9]{55}$/, "Contract ID must start with 'C' and be 56 characters long"),
    NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID: z
      .string()
      .regex(/^C[A-Z0-9]{55}$/, "Contract ID must start with 'C' and be 56 characters long"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
    NEXT_PUBLIC_HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL,
    NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID: process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID,
    NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID: process.env.NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
