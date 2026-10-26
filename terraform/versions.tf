terraform {
  # Write-only arguments need Terraform 1.11+ and an AWS provider that supports secret_string_wo.
  required_version = ">= 1.11"
  required_providers {
    aws     = { source = "hashicorp/aws", version = ">= 6.0" }
    random  = { source = "hashicorp/random", version = ">= 3.7" }
    archive = { source = "hashicorp/archive", version = ">= 2.4" }
  }
}

provider "aws" {
  region = var.region
}
