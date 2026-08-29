# Vendor secrets — referenced by ECS task definition (not plaintext environment).

locals {
  secret_payload = merge(
    var.fmp_api_key != "" ? { fmp_api_key = var.fmp_api_key } : {},
    var.openai_api_key != "" ? { openai_api_key = var.openai_api_key } : {},
    var.oidc_client_secret != "" ? { oidc_client_secret = var.oidc_client_secret } : {},
    var.smtp_pass != "" ? { smtp_pass = var.smtp_pass } : {},
    var.alphahunter_api_key != "" ? { alphahunter_api_key = var.alphahunter_api_key } : {},
  )
  secrets_enabled = var.use_secrets_manager && length(local.secret_payload) > 0
  secret_key_map = {
    fmp_api_key         = "INTELLENS_FMP_API_KEY"
    openai_api_key      = "OPENAI_API_KEY"
    oidc_client_secret  = "OIDC_CLIENT_SECRET"
    smtp_pass           = "SMTP_PASS"
    alphahunter_api_key = "ALPHAHUNTER_API_KEY"
  }
  api_secret_refs = [
    for key, env_name in local.secret_key_map : {
      name      = env_name
      valueFrom = "${aws_secretsmanager_secret.app[0].arn}:${key}::"
    }
    if contains(keys(local.secret_payload), key)
  ]
}

resource "aws_secretsmanager_secret" "app" {
  count       = local.secrets_enabled ? 1 : 0
  name        = "${local.name_prefix}/app-secrets"
  description = "CiteAlpha vendor API keys (FMP, LLM, OIDC, SMTP, AlphaHunter)"

  tags = {
    Name = "${local.name_prefix}-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app" {
  count         = local.secrets_enabled ? 1 : 0
  secret_id     = aws_secretsmanager_secret.app[0].id
  secret_string = jsonencode(local.secret_payload)
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  count = local.secrets_enabled ? 1 : 0
  name  = "${local.name_prefix}-ecs-execution-secrets"
  role  = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.app[0].arn]
    }]
  })
}
