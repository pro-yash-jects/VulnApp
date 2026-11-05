output "ec2_instance_id" {
  description = "AWS EC2 Instance ID"
  value       = aws_instance.devsecops_server.id
}

output "ec2_public_ip" {
  description = "Public IPv4 address of the EC2 instance"
  value       = var.create_eip ? aws_eip.devsecops_eip[0].public_ip : aws_instance.devsecops_server.public_ip
}

output "ssh_command" {
  description = "Convenience SSH command to connect to EC2"
  value       = "ssh -i <your-key.pem> ec2-user@${var.create_eip ? aws_eip.devsecops_eip[0].public_ip : aws_instance.devsecops_server.public_ip}"
}

output "application_url" {
  description = "URL to access the DevSecOps Web Application"
  value       = "http://${var.create_eip ? aws_eip.devsecops_eip[0].public_ip : aws_instance.devsecops_server.public_ip}:3000"
}

output "health_check_url" {
  description = "URL for the SRE Healthcheck endpoint"
  value       = "http://${var.create_eip ? aws_eip.devsecops_eip[0].public_ip : aws_instance.devsecops_server.public_ip}:3000/health"
}

output "metrics_url" {
  description = "URL for the raw Prometheus Metrics scrape endpoint"
  value       = "http://${var.create_eip ? aws_eip.devsecops_eip[0].public_ip : aws_instance.devsecops_server.public_ip}:3000/metrics"
}

output "grafana_dashboard_url" {
  description = "URL for the Grafana Observability Dashboard"
  value       = "http://${var.create_eip ? aws_eip.devsecops_eip[0].public_ip : aws_instance.devsecops_server.public_ip}:3005"
}

output "prometheus_ui_url" {
  description = "URL for Prometheus UI"
  value       = "http://${var.create_eip ? aws_eip.devsecops_eip[0].public_ip : aws_instance.devsecops_server.public_ip}:9090"
}
