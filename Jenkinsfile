pipeline {
    agent any

    triggers {
        pollSCM('* * * * *') // cherche push toute les minutes
    }

    tools {
        maven 'MAVEN'
        jdk 'JDK17'
        nodejs 'node18'
    }

    environment {
        MVN_OPTS = '-B'
        HOME = '/tmp/jenkins-home'
        NEXUS_DOCKER_REGISTRY = 'localhost:5001'
        IMAGE_VERSION = '0.0.1-SNAPSHOT'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('BACKEND - Build & Test') {
            steps {
                sh "mvn ${env.MVN_OPTS} clean verify dependency:copy-dependencies"
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Frontend - Build & Test') {
            steps {
                dir('frontend') {
                    sh '''
                        export HOME=/tmp/jenkins-home
                        npm ci
                        npm test -- --watch=false --browsers=ChromeHeadlessCI --code-coverage --reporters=progress,coverage
                    '''
                }
            }
        }

        stage('SonarQube Full Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Publish Maven Artifacts to Nexus') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-admin',
                        usernameVariable: 'NEXUS_USERNAME',
                        passwordVariable: 'NEXUS_PASSWORD'
                    )
                ]) {
                    sh "mvn ${env.MVN_OPTS} -DskipTests deploy"
                }
            }
        }

        stage('Publish Docker Images to Nexus') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-admin',
                        usernameVariable: 'NEXUS_USERNAME',
                        passwordVariable: 'NEXUS_PASSWORD'
                    )
                ]) {
                    sh '''
                        echo "$NEXUS_PASSWORD" | docker login ${NEXUS_DOCKER_REGISTRY} -u "$NEXUS_USERNAME" --password-stdin

                        docker build -t ${NEXUS_DOCKER_REGISTRY}/user-service:${IMAGE_VERSION} ./backend/user-service
                        docker push ${NEXUS_DOCKER_REGISTRY}/user-service:${IMAGE_VERSION}

                        docker build -t ${NEXUS_DOCKER_REGISTRY}/product-service:${IMAGE_VERSION} ./backend/product-service
                        docker push ${NEXUS_DOCKER_REGISTRY}/product-service:${IMAGE_VERSION}

                        docker build -t ${NEXUS_DOCKER_REGISTRY}/media-service:${IMAGE_VERSION} ./backend/media-service
                        docker push ${NEXUS_DOCKER_REGISTRY}/media-service:${IMAGE_VERSION}

                        docker build -t ${NEXUS_DOCKER_REGISTRY}/order-service:${IMAGE_VERSION} ./backend/order-service
                        docker push ${NEXUS_DOCKER_REGISTRY}/order-service:${IMAGE_VERSION}
                    '''
                }
            }
        }

        stage('Deployment') {
            steps {
                script {
                    try {
                        sh '''
                            echo "=== Déploiement ==="
                            docker-compose down
                            docker-compose up -d --build
                        '''
                    } catch (err) {
                        echo "Déploiement échoué"
                        if (fileExists('docker-compose.yml')) {
                            sh 'docker-compose up -d'
                        }
                        throw err
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build réussi!"
        }

        failure {
            echo "❌ Build échoué!"
        }
    }
}