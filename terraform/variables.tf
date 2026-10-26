variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "name" {
  type    = string
  default = "secrets-demo"
}

# Region-specific ARN of the AWS Parameters and Secrets Lambda Extension layer.
# Look it up in the AWS docs ("AWS Parameters and Secrets Lambda Extension ARNs") for your region.
variable "extension_layer_arn" {
  type = string
}

# Bump this to rotate the generated value (write-only args can't be diffed, so Terraform needs a signal).
variable "secret_version" {
  type    = number
  default = 1
}
