variable "aws_region" {
  description = "Target AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "instance_type" {
  description = "AWS EC2 instance type (t3.small recommended for app + Prometheus + Grafana)"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Name of existing AWS EC2 SSH Key Pair"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks authorized for SSH administrative access (port 22)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Recommend restricting to corporate VPN or bastion IP in production
}

variable "allowed_monitoring_cidr" {
  description = "CIDR blocks authorized to access Prometheus and Grafana ports"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "create_eip" {
  description = "Whether to allocate an AWS Elastic IP for static addressing"
  type        = bool
  default     = false
}
