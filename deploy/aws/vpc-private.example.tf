# Optional private / VPC deploy template (Enterprise · One-Stop MSA)
#
# Copy pieces into main.tf after customer provides VPC + private subnets.
# Do not apply blindly — NAT or VPC endpoints are required for ECR pulls.

/*
variable "private_subnet_ids" {
  type    = list(string)
  default = []
}

variable "assign_public_ip" {
  type    = bool
  default = false
}

# Internal ALB (no internet) — pair with VPN / Direct Connect / PrivateLink
resource "aws_lb" "internal" {
  name               = "${local.name_prefix}-internal"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.private_subnet_ids
}

# ECS service network_configuration example:
#   subnets          = var.private_subnet_ids
#   assign_public_ip = false
#   security_groups  = [aws_security_group.ecs.id]
#
# Required outbound:
#   - ECR (com.amazonaws.region.ecr.api / dkr) VPC endpoints OR NAT Gateway
#   - CloudWatch Logs endpoint OR NAT
#   - S3 gateway endpoint for ECR layers (recommended)
*/

# Marker for product posture API
# VPC_DEPLOY=true when this profile is active in the customer account.
