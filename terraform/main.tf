terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "Cloud-Native-DevSecOps"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

# Fetch default VPC
data "aws_vpc" "default" {
  default = true
}

# Fetch default subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Find latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for DevSecOps Deployment & Observability Stack
resource "aws_security_group" "devsecops_sg" {
  name        = "${var.environment}-devsecops-sg"
  description = "Security group for DevSecOps containerized app and SRE observability stack"
  vpc_id      = data.aws_vpc.default.id

  # SSH Access
  ingress {
    description = "SSH Administration"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # Web Application HTTP
  ingress {
    description = "Application HTTP Port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Standard HTTP Traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus Telemetry Port (Restricted to monitoring CIDR)
  ingress {
    description = "Prometheus Metrics Server"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = var.allowed_monitoring_cidr
  }

  # Grafana Dashboard Port
  ingress {
    description = "Grafana SRE Dashboards"
    from_port   = 3005
    to_port     = 3005
    protocol    = "tcp"
    cidr_blocks = var.allowed_monitoring_cidr
  }

  # Outbound rules - unrestricted Internet access for package installs / Docker pulls
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# AWS EC2 Instance for DevSecOps Hosting
resource "aws_instance" "devsecops_server" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.instance_type
  key_name                    = var.key_name != "" ? var.key_name : null
  vpc_security_group_ids      = [aws_security_group.devsecops_sg.id]
  subnet_id                   = tolist(data.aws_subnets.default.ids)[0]
  associate_public_ip_address = false
  user_data                   = file("${path.module}/scripts/user-data.sh")

  root_block_device {
    volume_size           = 25
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = {
    Name = "${var.environment}-devsecops-ec2-node"
    Role = "Application-and-Monitoring-Host"
  }
}

# Optional Elastic IP for persistent production DNS binding
resource "aws_eip" "devsecops_eip" {
  count    = var.create_eip ? 1 : 0
  instance = aws_instance.devsecops_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.environment}-devsecops-eip"
  }
}
