pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "connexcodeworks/myapp:v1"  // Replace with your DockerHub username & image name
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main', credentialsId: 'github-credentials', url: 'https://github.com/niroshmadushan/NewFileManagemnt.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE} ."
            }
        }

        stage('Push Docker Image') {
            steps {
                withDockerRegistry([credentialsId: 'docker-hub-credentials', url: '']) {
                    sh "docker push ${DOCKER_IMAGE}"
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sh "docker stop jenkins-container || true"
                sh "docker rm jenkins-container || true"
                sh "docker run -d -p 3000:3000 --name jenkins-container ${DOCKER_IMAGE}"
            }
        }
    }
}
