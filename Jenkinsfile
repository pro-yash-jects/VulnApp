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
                echo "--> Running Gitleaks in Audit Mode..."
                sh '''
                    docker run --rm \
                    --volumes-from jenkins-devsecops \
                    -w "${WORKSPACE}" \
                    zricethezav/gitleaks:latest detect \
                    --source="." --verbose --no-git \
                    --report-format json --report-path gitleaks-report.json || true
                '''
                // Archive the generated JSON report
                archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
            }
        }

        stage('3. SAST Scan (Semgrep)') {
            steps {
                echo "--> Running Semgrep in Audit Mode..."
                sh '''
                    docker run --rm \
                    --volumes-from jenkins-devsecops \
                    -w "${WORKSPACE}" \
                    returntocorp/semgrep semgrep \
                    --config=auto . \
                    --json -o semgrep-report.json || true
                '''
                archiveArtifacts artifacts: 'semgrep-report.json', allowEmptyArchive: true
            }
        }

        stage('4. SCA Scan (Trivy Filesystem)') {
            steps {
                echo "--> Scanning dependencies and saving report..."
                sh '''
                    docker run --rm \
                    --volumes-from jenkins-devsecops \
                    -w "${WORKSPACE}" \
                    aquasec/trivy:latest fs \
                    --severity HIGH,CRITICAL \
                    --format json --output trivy-fs-report.json \
                    --exit-code 0 \
                    . || true
                '''
                archiveArtifacts artifacts: 'trivy-fs-report.json', allowEmptyArchive: true
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
                echo "--> Scanning built container image and saving report..."
                sh '''
                    docker run --rm \
                    --volumes-from jenkins-devsecops \
                    -w "${WORKSPACE}" \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image \
                    --severity HIGH,CRITICAL \
                    --format json --output trivy-image-report.json \
                    --exit-code 0 \
                    ${APP_NAME}:${IMAGE_TAG} || true
                '''
                archiveArtifacts artifacts: 'trivy-image-report.json', allowEmptyArchive: true
            }
        }

        stage('7. Deploy to Local Staging') {
            steps {
                echo "--> Deploying app container..."
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
                echo "--> Running OWASP ZAP and saving HTML/JSON reports..."
                // Running as root ensures ZAP has permission to write reports to the Jenkins workspace volume
                sh '''
                    docker run --rm \
                    --volumes-from jenkins-devsecops \
                    -w "${WORKSPACE}" \
                    --user root \
                    --network ${NET_NAME} \
                    ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
                    -t http://${APP_NAME}-staging:${APP_PORT} \
                    -I -J zap-report.json -r zap-report.html || true
                '''
                archiveArtifacts artifacts: 'zap-report.*', allowEmptyArchive: true
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
            echo "✅ Pipeline finished. Check the 'Build Artifacts' tab for security reports."
        }
    }
}