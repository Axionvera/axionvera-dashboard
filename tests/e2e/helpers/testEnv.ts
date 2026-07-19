import fs from 'node:fs';
import path from 'node:path';

export type EnvMap = Record<string, string>;

export function parseEnvContent(content: string): EnvMap {
  return content.split('\n').reduce<EnvMap>((env, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return env;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const normalizedKey = key.trim();

    if (!normalizedKey) {
      return env;
    }

    env[normalizedKey] = valueParts.join('=').trim();
    return env;
  }, {});
}

export function readEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return parseEnvContent(fs.readFileSync(filePath, 'utf8'));
}

export function loadPlaywrightTestEnv(rootDir = process.cwd()): EnvMap {
  return readEnvFile(path.join(rootDir, '.env.test'));
}

export function applyEnvDefaults(
  env: NodeJS.ProcessEnv,
  defaults: EnvMap
): NodeJS.ProcessEnv {
  for (const [key, value] of Object.entries(defaults)) {
    if (env[key] === undefined) {
      env[key] = value;
    }
  }

  return env;
}
