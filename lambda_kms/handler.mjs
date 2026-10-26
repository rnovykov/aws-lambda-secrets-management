// LEGACY / NOT RECOMMENDED for secrets in 2026. Kept so the 2023 article still has a working example.
// Anyone with lambda:GetFunction can read environment variables, so store secrets in
// Secrets Manager or Parameter Store instead (see ../secrets_manager_extension).
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

const kms = new KMSClient({});
let plaintext; // decrypted once per execution environment

export const handler = async () => {
  if (!plaintext) {
    const res = await kms.send(new DecryptCommand({
      CiphertextBlob: Buffer.from(process.env.ENCRYPTED_SECRET, 'base64'),
      // Values encrypted with the Lambda console's encryption helpers are bound to this context.
      EncryptionContext: { LambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME },
    }));
    plaintext = Buffer.from(res.Plaintext).toString('utf8');
  }
  // Use plaintext here. Never log it.
  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
