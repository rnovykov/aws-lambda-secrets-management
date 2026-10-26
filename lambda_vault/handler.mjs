// HashiCorp Vault via the Vault Lambda extension (added as a layer).
// The extension logs in with the function's IAM role (Vault "aws" auth, iam method)
// and runs a local proxy on 127.0.0.1:8200 that adds the Vault token for you.
// No VAULT_TOKEN env var, no IAM calls from the function, no axios.
//
// Extension config (function environment variables):
//   VAULT_ADDR=https://vault.example.com:8200
//   VAULT_AUTH_PROVIDER=aws
//   VAULT_AUTH_ROLE=<vault role bound to this function's IAM role ARN>
// App config:
//   SECRET_PATH=secret/data/my-app   (KV v2 path)

export const handler = async () => {
  const res = await fetch(`http://127.0.0.1:8200/v1/${process.env.SECRET_PATH}`);
  if (!res.ok) throw new Error(`Vault proxy returned HTTP ${res.status}`);
  const body = await res.json();
  const secret = body.data?.data ?? body.data; // KV v2 nests data one level deeper
  console.log(`Secret loaded, keys: ${Object.keys(secret).join(', ')}`);
  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
