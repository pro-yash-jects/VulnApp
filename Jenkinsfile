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
                echo "================================================="
                echo "--> STAGE 2: GITLEAKS SECRETS SCAN"
                echo "================================================="
                sh '''
                    # Gitleaks natively prints to console AND saves to file
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    zricethezav/gitleaks:latest detect \
                    --source="." --verbose --no-git \
                    --report-format json --report-path gitleaks-report.json || true
                '''
            }
        }

        stage('3. SAST Scan (Semgrep)') {
            steps {
                echo "================================================="
                echo "--> STAGE 3: SEMGREP SAST SCAN"
                echo "================================================="
                sh '''
                    # 1. Output readable text to Jenkins Console
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    returntocorp/semgrep semgrep --config=auto . || true
                    
                    # 2. Silently generate JSON structured artifact
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    returntocorp/semgrep semgrep --config=auto . \
                    --json -o semgrep-report.json || true
                '''
            }
        }

        stage('4. SCA Scan (Trivy Filesystem)') {
            steps {
                echo "================================================="
                echo "--> STAGE 4: TRIVY DEPENDENCY SCAN"
                echo "================================================="
                sh '''
                    # 1. Output readable table to Jenkins Console
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    aquasec/trivy:latest fs \
                    --severity HIGH,CRITICAL . || true
                    
                    # 2. Silently generate JSON structured artifact
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    aquasec/trivy:latest fs \
                    --severity HIGH,CRITICAL \
                    --format json --output trivy-fs-report.json . || true
                '''
            }
        }

        stage('5. Docker Build') {
            steps {
                echo "================================================="
                echo "--> STAGE 5: BUILD APPLICATION IMAGE"
                echo "================================================="
                sh "docker build -t ${APP_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('6. Container Image Scan (Trivy Image)') {
            steps {
                echo "================================================="
                echo "--> STAGE 6: TRIVY CONTAINER SCAN"
                echo "================================================="
                sh '''
                    # 1. Output readable table to Jenkins Console
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image \
                    --severity HIGH,CRITICAL ${APP_NAME}:${IMAGE_TAG} || true
                    
                    # 2. Silently generate JSON structured artifact
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image \
                    --severity HIGH,CRITICAL \
                    --format json --output trivy-image-report.json ${APP_NAME}:${IMAGE_TAG} || true
                '''
            }
        }

        stage('7. Deploy to Local Staging') {
            steps {
                echo "================================================="
                echo "--> STAGE 7: DEPLOY TO LOCAL STAGING"
                echo "================================================="
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
                echo "================================================="
                echo "--> STAGE 8: OWASP ZAP DYNAMIC SCAN"
                echo "================================================="
                sh '''
                    VOL_NAME="zap-reports-${BUILD_NUMBER}"
                    docker volume create $VOL_NAME || true
                    
                    # 1. Run ZAP and generate HTML/JSON inside the isolated volume
                    docker run --rm \
                    -v $VOL_NAME:/zap/wrk \
                    --user root --network ${NET_NAME} \
                    ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
                    -t http://${APP_NAME}-staging:${APP_PORT} \
                    -I -J zap-report.json -r zap-report.html || true
                    
                    # 2. Transfer the reports from the isolated volume to Jenkins Workspace
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops \
                    -v $VOL_NAME:/zap/wrk \
                    alpine sh -c "cp /zap/wrk/zap-report.* ${WORKSPACE}/ || true"
                    
                    docker volume rm $VOL_NAME || true
                '''
            }
        }

        stage('9. Artifact Generation') {
            steps {
                echo "================================================="
                echo "--> STAGE 9: SECURING AND ARCHIVING REPORTS"
                echo "================================================="
                sh '''
                    # Fix ownership of all reports so the Jenkins user can read/archive them
                    docker run --rm --user root \
                    --volumes-from jenkins-devsecops -w "${WORKSPACE}" \
                    alpine chown 1000:1000 gitleaks-report.json semgrep-report.json trivy-fs-report.json trivy-image-report.json zap-report.json zap-report.html || true
                '''
                
                // Archive all generated structured files
                archiveArtifacts artifacts: '*-report.*'
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
            echo "✅ Pipeline Audited Successfully. All Structured Artifacts are available for download!"
        }
    }
}