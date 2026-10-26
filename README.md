# aws-lambda-secrets-management

Code for the Medium series **Secret management in AWS serverless**
([Part 1](https://medium.com/@just_novik/secret-management-in-aws-serverless-part-1-307945205202),
[Part 2](https://medium.com/@just_novik/secret-management-in-aws-serverless-part-2-6d16c04373a1),
[Part 3](https://medium.com/@just_novik/secret-management-in-aws-serverless-part-3-what-three-years-changed-what-i-got-wrong-and-the-a6824278f540) the 2026 rewrite).

> **2026 refresh.** All examples now use AWS SDK for JavaScript **v3** on Node.js 20+, never log secret values,
> and the Vault example uses the Vault Lambda extension. The original 2023 code is in git history.

| Folder | Pattern | Status |
|---|---|---|
| [`secrets_manager_extension/`](secrets_manager_extension) | Secrets Manager + AWS Parameters and Secrets Lambda Extension (localhost:2773 cache) | **Recommended** |
| [`secrets_manager/`](secrets_manager/README.md) | Secrets Manager via SDK v3 with an in-process TTL cache | OK when you can't add a layer |
| [`lambda_vault/`](lambda_vault) | HashiCorp Vault via the Vault Lambda extension + IAM auth | Recommended if you run Vault |
| [`lambda_kms/`](lambda_kms/README.md) | KMS-encrypted environment variable | **Legacy, not recommended for secrets** |
| [`terraform/`](terraform) | Deploys the recommended pattern; secret value kept **out of Terraform state** via `secret_string_wo` | |

## Deploy the recommended pattern

```bash
cd terraform
terraform init
terraform apply -var 'extension_layer_arn=<extension layer ARN for your region>'
aws lambda invoke --function-name secrets-demo /dev/stdout
```

Requires Terraform >= 1.11 (write-only arguments and ephemeral resources). To rotate the generated value,
bump `-var secret_version=2`.

### Check that the secret is not in state

```bash
terraform state pull | grep -c apiKey   # expect 0
```

### Check that the cache works

Invoke the function repeatedly and count `GetSecretValue` events in CloudTrail. The count should stay flat while
invocations rise (default cache TTL is 300 seconds).

## Changes since 2023

- SDK v2 (`require('aws-sdk')`) replaced with modular v3 clients.
- No example logs a secret value any more.
- Vault: removed the sample that called `iam.putRolePolicy` and `assumeRole` at runtime and used an access key ID as
  a Vault token. That code could not authenticate and should not be reused.
- KMS env-var example marked legacy: env vars are readable by anyone with `lambda:GetFunction`.
- Added Terraform with write-only secret arguments so plaintext never reaches `terraform.tfstate`.
