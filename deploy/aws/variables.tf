variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "intellens-gci"
}

variable "environment" {
  type    = string
  default = "aws"
}

variable "vpc_id" {
  type        = string
  description = "VPC for ECS (default VPC recommended for first deploy)"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Public subnet(s); first is used for the single Fargate task (no ALB)"
}

variable "app_cpu" {
  type        = number
  default     = 512
  description = "Combined task CPU (api+web). 512 = 0.5 vCPU"
}

variable "app_memory" {
  type        = number
  default     = 1024
  description = "Combined task memory (MiB)"
}

variable "app_desired_count" {
  type    = number
  default = 1
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "use_fargate_spot" {
  type        = bool
  default     = true
  description = "Use Fargate Spot (~50–70% cheaper compute; OK for demo/pilot)"
}

variable "log_retention_days" {
  type    = number
  default = 7
}

variable "fmp_api_key" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Optional Financial Modeling Prep key for EOD tape (not GCI). Empty = demo history."
}

variable "enable_eip" {
  type        = bool
  default     = false
  description = "Allocate EIP (usually unused — Fargate ENI AssociateAddress is blocked)"
}

variable "acm_certificate_arn" {
  type        = string
  default     = ""
  description = "Optional ACM cert ARN in ap-south-1 for HTTPS :443 on the ALB"
}

variable "https_redirect" {
  type        = bool
  default     = true
  description = "When ACM is set, redirect HTTP→HTTPS"
}
