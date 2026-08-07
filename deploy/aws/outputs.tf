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
    var.acm_certificate_arn != ""
    ? "https://${aws_lb.app.dns_name}"
    : "http://${aws_lb.app.dns_name}"
  )
  description = "Review URL (HTTPS when acm_certificate_arn is set)"
}

output "https_enabled" {
  value = var.acm_certificate_arn != ""
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
