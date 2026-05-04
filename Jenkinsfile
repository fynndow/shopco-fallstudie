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
      steps {
        sh 'docker compose -f docker-compose.test.yml up -d db-test'
        sh 'npx wait-on tcp:localhost:5433 || sleep 5'
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
      steps {
        sh 'docker compose -f docker-compose.test.yml up -d'
        sh 'npx wait-on http://localhost:3000/api/health'
        sh 'npx cypress run --headless'
      }
      post {
        always {
          archiveArtifacts artifacts: 'cypress/screenshots/**,cypress/videos/**', allowEmptyArchive: true
          sh 'docker compose -f docker-compose.test.yml down -v'
        }
      }
    }

    stage('Deploy Staging') {
      when { branch 'main' }
      steps {
        sh './scripts/deploy.sh staging'
        sh 'curl -f http://staging.shopco.de/api/health'
      }
    }

    stage('Manual Approval') {
      when { branch 'main' }
      steps {
        input message: 'Deploy to Production?', ok: 'Deploy'
        sh './scripts/deploy.sh production'
      }
    }
  }

  post {
    always {
      sh 'docker compose -f docker-compose.test.yml down -v || true'
    }
    failure {
      mail to: 'team@shopco.de',
           subject: "Build #${env.BUILD_NUMBER} failed",
           body: "See ${env.BUILD_URL}"
    }
  }
}
