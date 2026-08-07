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

variable "sso_enabled" {
  type        = bool
  default     = false
  description = "Set SSO=true on the API task for OIDC login"
}

variable "oidc_client_id" {
  type      = string
  default   = ""
  sensitive = true
}

variable "oidc_client_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "oidc_issuer" {
  type    = string
  default = ""
}

variable "oidc_redirect_uri" {
  type        = string
  default     = ""
  description = "Must match IdP app registration (usually https://host/api/auth/sso/callback)"
}

variable "alphahunter_api_url" {
  type        = string
  default     = ""
  description = "Live facts vendor URL (ALPHAHUNTER_API_URL)"
}

variable "alphahunter_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "csm_email" {
  type    = string
  default = ""
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

variable "domain_name" {
  type        = string
  default     = ""
  description = "Optional apex domain for HTTPS (e.g. ocotilloinnovation.in). Empty = ALB DNS only."
}

variable "manage_dns" {
  type        = bool
  default     = true
  description = "When domain_name is set, create Route53 zone + ACM validation + A/ALIAS records"
}
