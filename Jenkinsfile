pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "connexcodeworks/myapp:v1"  // Replace with your DockerHub username & image name
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main', credentialsId: 'niroshtest', url: 'https://github.com/niroshmadushan/NewFileManagemnt.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat "docker build -t %DOCKER_IMAGE% ."
            }
        }

        stage('Push Docker Image') {
            steps {
                withDockerRegistry([credentialsId: 'docker_hub', url: '']) {
                    bat "docker push %DOCKER_IMAGE%"
                }
            }
        }

        stage('Deploy Container') {
            steps {
                bat "docker stop jenkins-container || exit 0"
                bat "docker rm jenkins-container || exit 0"
                bat "docker run -d -p 3000:3000 --name jenkins-container %DOCKER_IMAGE%"
            }
        }
    }
}
