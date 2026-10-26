// Recommended 2026 pattern: AWS Parameters and Secrets Lambda Extension.
// The extension (added as a layer) caches secrets and serves them on localhost:2773.
// No SDK is needed. Node.js 20+ ships global fetch.
const PORT = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? '2773';

async function getSecret(secretId, attempts = 3) {
  const url = `http://localhost:${PORT}/secretsmanager/get?secretId=${encodeURIComponent(secretId)}`;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN },
        signal: AbortSignal.timeout(1000),
      });
      if (!res.ok) throw new Error(`extension returned HTTP ${res.status}`);
      const { SecretString } = await res.json();
      return JSON.parse(SecretString);
    } catch (err) {
      // Short retry: the local endpoint has been reported to hang intermittently under load.
      if (i === attempts) throw err;
    }
  }
}

export const handler = async () => {
  const secret = await getSecret(process.env.SECRET_NAME);
  console.log(`Secret loaded, keys: ${Object.keys(secret).join(', ')}`);
  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
