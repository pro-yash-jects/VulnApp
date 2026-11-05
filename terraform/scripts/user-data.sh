#!/usr/bin/env bash
set -e

# ==============================================================================
# AWS EC2 Cloud-Init Provisioning Script
# Installs Docker, Docker Compose, Git, and prepares DevSecOps directories
# ==============================================================================

echo "[INFO] Updating system packages..."
if command -v dnf &> /dev/null; then
    # Amazon Linux 2023 / Fedora / RHEL
    dnf update -y
    dnf install -y docker git curl
    systemctl enable --now docker
    usermod -aG docker ec2-user
    # Install Docker Compose Plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
elif command -v apt-get &> /dev/null; then
    # Ubuntu / Debian
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release git
    mkdir -m 0755 -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    usermod -aG docker ubuntu
fi

echo "[INFO] Creating deployment directories in /opt/devsecops..."
mkdir -p /opt/devsecops/monitoring
chmod -R 775 /opt/devsecops
if id "ec2-user" &>/dev/null; then
    chown -R ec2-user:ec2-user /opt/devsecops
elif id "ubuntu" &>/dev/null; then
    chown -R ubuntu:ubuntu /opt/devsecops
fi

echo "[INFO] EC2 DevSecOps Host provisioning completed successfully."
