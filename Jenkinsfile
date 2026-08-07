// IntelLens GCI — Jenkins declarative pipeline.
// Mirrors scripts/ci-verify.sh so local and CI runs stay identical.
// Agent prerequisites: Docker (with compose v2), Node 20+, Python 3.12+, curl.
// See docs/CI_JENKINS.md for setup and credentials.

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '25'))
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        CI = 'true'
        AWS_REGION = 'ap-south-1'
    }

    stages {
        stage('Backend tests') {
            steps {
                sh '''
                    cd backend
                    python3 -m pip install -q -r requirements.txt
                    mkdir -p reports
                    PYTHONPATH=. python3 -m pytest -q --junitxml=reports/pytest.xml
                '''
            }
        }

        stage('Frontend test + build') {
            steps {
                sh '''
                    cd frontend
                    if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi
                    npm test
                    npm run build
                '''
            }
        }

        stage('Compose up + E2E') {
            steps {
                sh '''
                    docker compose up --build -d
                    echo "Waiting for API health..."
                    for i in $(seq 1 30); do
                        if curl -sf http://127.0.0.1:8000/health >/dev/null; then break; fi
                        sleep 2
                    done
                    curl -sf http://127.0.0.1:8000/health | grep -q ok

                    cd e2e
                    if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi
                    npx playwright install chromium
                    mkdir -p reports
                    E2E_BASE_URL=http://127.0.0.1:8080 npx playwright test
                '''
            }
            post {
                always {
                    sh 'docker compose down -v || true'
                }
            }
        }

        stage('Package images') {
            steps {
                sh '''
                    SHORT_SHA=$(git rev-parse --short HEAD)
                    docker build -t intellens-api:${SHORT_SHA} backend
                    docker build -t intellens-web:${SHORT_SHA} frontend
                    docker tag intellens-api:${SHORT_SHA} intellens-api:latest
                    docker tag intellens-web:${SHORT_SHA} intellens-web:latest
                '''
            }
        }

        stage('Deploy to AWS') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy this build to AWS Fargate?', ok: 'Deploy'
                // Requires an aws-intellens credential (AWS access key pair) configured
                // in Jenkins, plus Terraform on the agent. Reuses the existing script
                // so CI deploys exactly what a manual deploy would.
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-intellens'
                ]]) {
                    sh './scripts/aws-deploy.sh'
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true,
                  testResults: 'backend/reports/pytest.xml, e2e/reports/junit.xml'
            archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
        }
    }
}
