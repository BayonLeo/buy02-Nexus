pipeline {
    agent any

    triggers {
        pollSCM('* * * * *') // cherche push toute les minutes
    }

    environment {
        MVN_OPTS = '-B'
        NEXUS_DOCKER_REGISTRY = 'localhost:5001'
        IMAGE_VERSION = '0.0.1-SNAPSHOT'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Start MongoDB') {
            steps {
                bat '''
                    docker rm -f buy02-mongo >nul 2>nul
                    docker run -d --name buy02-mongo -p 27017:27017 mongo:6.0
                    powershell -NoProfile -Command "$ready = $false; for ($i = 0; $i -lt 30; $i++) { try { $client = New-Object Net.Sockets.TcpClient('localhost', 27017); $client.Close(); $ready = $true; break } catch { Start-Sleep -Seconds 2 } }; if (-not $ready) { exit 1 }"
                '''
            }
        }

        stage('BACKEND - Build & Test') {
            steps {
                bat "mvn %MVN_OPTS% clean verify dependency:copy-dependencies"
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
                    bat '''
                        if not exist "%TEMP%\\jenkins-home" mkdir "%TEMP%\\jenkins-home"
                        set "HOME=%TEMP%\\jenkins-home"
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
                        bat "\"${scannerHome}\\bin\\sonar-scanner.bat\""
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
                    bat "mvn %MVN_OPTS% -DskipTests deploy"
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
                    bat '''
                        echo %NEXUS_PASSWORD% | docker login %NEXUS_DOCKER_REGISTRY% -u %NEXUS_USERNAME% --password-stdin

                        docker build -t %NEXUS_DOCKER_REGISTRY%/user-service:%IMAGE_VERSION% ./backend/user-service
                        docker push %NEXUS_DOCKER_REGISTRY%/user-service:%IMAGE_VERSION%

                        docker build -t %NEXUS_DOCKER_REGISTRY%/product-service:%IMAGE_VERSION% ./backend/product-service
                        docker push %NEXUS_DOCKER_REGISTRY%/product-service:%IMAGE_VERSION%

                        docker build -t %NEXUS_DOCKER_REGISTRY%/media-service:%IMAGE_VERSION% ./backend/media-service
                        docker push %NEXUS_DOCKER_REGISTRY%/media-service:%IMAGE_VERSION%

                        docker build -t %NEXUS_DOCKER_REGISTRY%/order-service:%IMAGE_VERSION% ./backend/order-service
                        docker push %NEXUS_DOCKER_REGISTRY%/order-service:%IMAGE_VERSION%
                    '''
                }
            }
        }

        stage('Deployment') {
            steps {
                script {
                    try {
                        bat '''
                            echo "=== Déploiement ==="
                            docker-compose down
                            docker-compose up -d --build
                        '''
                    } catch (err) {
                        echo "Déploiement échoué"
                        if (fileExists('docker-compose.yml')) {
                            bat 'docker-compose up -d'
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

        always {
            bat 'docker rm -f buy02-mongo >nul 2>nul || exit /b 0'
        }
    }
}