pipeline {
  agent any
  triggers {
    pollSCM('H/5 * * * *')
  }
  options {
    timestamps()
    ansiColor('xterm')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  environment {
    NODE_ENV = 'test'
    CI = 'true'
  }
  stages {
    stage('Build') {
      steps {
        sh 'npm ci'
        sh 'npx prisma generate'
      }
    }
    stage('Unit & Integration Tests') {
      environment {
        DATABASE_URL = 'postgresql://shopco:shopco@host.docker.internal:5433/shopco_test?schema=public'
      }
      steps {
        sh 'docker compose -f docker-compose.test.yml up -d db-test'
        sh 'npx wait-on tcp:host.docker.internal:5433 || sleep 5'
        sh 'npx prisma migrate deploy'
        sh 'npm run test:ci'
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'reports/*.xml'
          publishHTML(target: [
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report'
          ])
          archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
        }
      }
    }
    stage('E2E Tests') {
      environment {
        HOST_WORKSPACE = '/var/lib/docker/volumes/jenkins_home/_data/workspace/shopco-test'
      }
      steps {
        sh '''
          set -e
          docker compose -f docker-compose.test.yml --profile e2e up -d --wait --build || {
            echo "=== DB LOGS ==="
            docker compose -f docker-compose.test.yml logs db-test || true
            echo "=== APP LOGS ==="
            docker compose -f docker-compose.test.yml logs app-test || true
            echo "=== CYPRESS LOGS ==="
            docker compose -f docker-compose.test.yml logs cypress || true
            exit 1
          }
          docker compose -f docker-compose.test.yml --profile e2e run --rm cypress cypress run
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'cypress/screenshots/**,cypress/videos/**', allowEmptyArchive: true
          sh 'docker compose -f docker-compose.test.yml --profile e2e down -v || true'
        }
      }
    }
    stage('Deploy Staging') {
      when { expression { return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' } }
      steps {
        sh 'echo "→ Mock-Deployment in Staging-Umgebung (kein realer Staging-Server vorhanden)"'
        sh './scripts/deploy.sh staging'
        sh 'echo "→ Healthcheck OK (Mock; in Produktivumgebung: curl -f http://staging.shopco.de/api/health)"'
      }
    }
    stage('Manual Approval') {
      when { expression { return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' } }
      steps {
        timeout(time: 2, unit: 'MINUTES') {
          input message: 'Deploy to Production?', ok: 'Deploy'
        }
        sh 'echo "→ Mock-Deployment in Production-Umgebung (kein realer Prod-Server vorhanden)"'
      }
    }
  }
  post {
    always {
      sh 'docker compose -f docker-compose.test.yml down -v || true'
    }
  }
}
