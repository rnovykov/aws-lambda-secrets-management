# The secret value is generated ephemerally and passed through a write-only argument,
# so it never lands in the plan or terraform.tfstate.
ephemeral "random_password" "api_key" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "this" {
  name = "${var.name}/api-key"
}

resource "aws_secretsmanager_secret_version" "this" {
  secret_id                = aws_secretsmanager_secret.this.id
  secret_string_wo         = jsonencode({ apiKey = ephemeral.random_password.api_key.result })
  secret_string_wo_version = var.secret_version
}

data "archive_file" "fn" {
  type        = "zip"
  source_file = "${path.module}/../secrets_manager_extension/handler.mjs"
  output_path = "${path.module}/build/fn.zip"
}

resource "aws_iam_role" "fn" {
  name = "${var.name}-fn"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "lambda.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.fn.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Least privilege: read exactly one secret.
resource "aws_iam_role_policy" "read_secret" {
  role = aws_iam_role.fn.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "secretsmanager:GetSecretValue", Resource = aws_secretsmanager_secret.this.arn }]
  })
}

resource "aws_lambda_function" "fn" {
  function_name    = var.name
  role             = aws_iam_role.fn.arn
  runtime          = "nodejs20.x"
  handler          = "handler.handler"
  filename         = data.archive_file.fn.output_path
  source_code_hash = data.archive_file.fn.output_base64sha256
  layers           = [var.extension_layer_arn]
  timeout          = 10

  environment {
    variables = {
      SECRET_NAME                    = aws_secretsmanager_secret.this.name # the name, not the value
      SECRETS_MANAGER_TTL            = "300"
      PARAMETERS_SECRETS_EXTENSION_HTTP_PORT = "2773"
    }
  }
}

output "function_name" {
  value = aws_lambda_function.fn.function_name
}
