// AWS Secrets Manager via AWS SDK for JavaScript v3 (Node.js 20+ runtime).
// The client and the cached value live at module scope, so warm invocations reuse them.
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});
const TTL_MS = Number(process.env.SECRET_TTL_MS ?? 300_000);
let cache = { value: null, expires: 0 };

async function getSecret() {
  if (cache.value && Date.now() < cache.expires) return cache.value;
  const res = await client.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_NAME }));
  cache = { value: JSON.parse(res.SecretString), expires: Date.now() + TTL_MS };
  return cache.value;
}

export const handler = async () => {
  const secret = await getSecret();
  // Use the secret here (DB connection, API call, ...). Never log its value.
  console.log(`Secret loaded, keys: ${Object.keys(secret).join(', ')}`);
  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
