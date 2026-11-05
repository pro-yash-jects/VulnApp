#!/usr/bin/env bash
# ==============================================================================
# AWS EC2 DevSecOps Host Bootstrap Script
# Usage: ./scripts/setup-ec2.sh
# ==============================================================================
set -euo pipefail

echo "========================================================"
echo "🚀 Initializing AWS EC2 Host for DevSecOps Deployment"
echo "========================================================"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS=$(uname -s)
fi

echo "[INFO] Detected Operating System: $OS"

if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    echo "[INFO] Installing Docker on Amazon Linux / RHEL..."
    sudo dnf update -y
    sudo dnf install -y docker git curl
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"

    echo "[INFO] Installing Docker Compose CLI plugin..."
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    echo "[INFO] Installing Docker on Ubuntu / Debian..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release git
    sudo mkdir -m 0755 -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
fi

echo "[INFO] Preparing /opt/devsecops application directory..."
sudo mkdir -p /opt/devsecops/monitoring
sudo chown -R "$USER":"$USER" /opt/devsecops
sudo chmod -R 775 /opt/devsecops

echo "========================================================"
echo "✅ EC2 DevSecOps Host Bootstrap Complete!"
echo "Please re-login or run 'newgrp docker' to use docker without sudo."
echo "========================================================"
