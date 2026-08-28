output "ecr_api_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecr_web_url" {
  value = aws_ecr_repository.web.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "aws_region" {
  value = var.aws_region
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "alb_dns_name" {
  value       = aws_lb.app.dns_name
  description = "Stable ALB hostname for review sharing"
}

output "app_url" {
  value = (
    local.domain_enabled
    ? "https://${var.domain_name}"
    : (
      local.https_on
      ? "https://${aws_lb.app.dns_name}"
      : "http://${aws_lb.app.dns_name}"
    )
  )
  description = "Desired review URL (custom domain needs ACM ISSUED after Hostinger NS)"
}

output "https_enabled" {
  value = local.https_on
}

output "domain_name" {
  value = var.domain_name
}

output "route53_nameservers" {
  value       = try(aws_route53_zone.app[0].name_servers, [])
  description = "Set these NS at Hostinger for citealpha.com so ACM validates and HTTPS works"
}

output "acm_certificate_arn_effective" {
  value = local.effective_cert_arn != "" ? local.effective_cert_arn : try(aws_acm_certificate.app[0].arn, "")
}

output "eip_allocation_id" {
  value       = try(aws_eip.app[0].id, "")
  description = "Optional EIP allocation (usually empty)"
}

output "eip_public_ip" {
  value       = try(aws_eip.app[0].public_ip, "")
  description = "Optional EIP public IP"
}

output "app_url_hint" {
  value       = "Static review: http://${aws_lb.app.dns_name}"
  description = "Prefer ALB DNS from ./scripts/aws-app-url.sh"
}

output "auth_efs_id" {
  value       = try(aws_efs_file_system.auth[0].id, "")
  description = "EFS file system for persistent auth.db (empty when disabled)"
}

output "auth_persistence" {
  value = {
    use_db_auth     = var.use_db_auth
    auth_sqlite_path = var.auth_sqlite_path
    efs_enabled     = var.enable_auth_efs && var.use_db_auth
  }
}
