pipeline {
    agent any

    environment {
        APP_NAME     = "devsecops-vulnerable-node"
        IMAGE_TAG    = "local-${BUILD_NUMBER}"
        HOST_PORT    = "8002"
        APP_PORT     = "3000"
        NET_NAME     = "devsecops-net"
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('2. Secret Scan (Gitleaks)') {
            steps {
                echo "--> Scanning workspace for hardcoded secrets..."
                // Removes '|| true' to strictly fail the pipeline if secrets are found
                sh '''
                    docker run --rm -v "${WORKSPACE}":/path \
                    zricethezav/gitleaks:latest detect \
                    --source="/path" --verbose --no-git
                '''
            }
        }

        stage('3. SAST Scan (Semgrep)') {
            steps {
                echo "--> Running Semgrep static code analysis..."
                // Strict failure on command injection or XSS patterns in source code
                sh '''
                    docker run --rm -v "${WORKSPACE}":/src \
                    returntocorp/semgrep semgrep \
                    --config=auto /src --error --timeout 120
                '''
            }
        }

        stage('4. SCA Scan (Trivy Filesystem)') {
            steps {
                echo "--> Scanning dependencies for known CVEs..."
                // Exits with code 1 (fails build) if HIGH or CRITICAL CVEs are in package.json
                sh '''
                    docker run --rm -v "${WORKSPACE}":/root/workspace \
                    aquasec/trivy:latest fs \
                    --severity HIGH,CRITICAL \
                    --exit-code 1 \
                    /root/workspace
                '''
            }
        }

        stage('5. Docker Build') {
            steps {
                echo "--> Building container image..."
                sh "docker build -t ${APP_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('6. Container Image Scan (Trivy Image)') {
            steps {
                echo "--> Scanning built container image..."
                sh '''
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image \
                    --severity HIGH,CRITICAL \
                    --exit-code 1 \
                    ${APP_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('7. Deploy to Local Staging') {
            steps {
                echo "--> Deploying app container to port ${HOST_PORT}..."
                sh '''
                    docker network create ${NET_NAME} || true
                    docker rm -f ${APP_NAME}-staging || true
                    
                    docker run -d \
                      --name ${APP_NAME}-staging \
                      --network ${NET_NAME} \
                      -p ${HOST_PORT}:${APP_PORT} \
                      ${APP_NAME}:${IMAGE_TAG}
                    
                    sleep 5
                '''
            }
        }

        stage('8. DAST Scan (OWASP ZAP)') {
            steps {
                echo "--> Running OWASP ZAP dynamic analysis..."
                // ZAP communicates over the internal bridge network directly to the container's internal port
                sh '''
                    docker run --rm \
                      --network ${NET_NAME} \
                      ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
                      -t http://${APP_NAME}-staging:${APP_PORT} \
                      -I
                '''
            }
        }
    }

    post {
        always {
            echo "--> Cleaning up staging containers and temporary network..."
            sh '''
                docker rm -f ${APP_NAME}-staging || true
                docker network rm ${NET_NAME} || true
            '''
        }
        success {
            echo "✅ Pipeline executed successfully: all security stages passed."
        }
        failure {
            echo "❌ Pipeline failed due to security vulnerabilities. Review logs above."
        }
    }
}
