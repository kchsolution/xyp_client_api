pipeline {
    agent any
    stages {
        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker build -f dockerfile -t xyp_client_api .'
                    sh 'docker stop xyp_client_api &> /dev/null || true'
                    sh 'docker rm -f xyp_client_api &> /dev/null || true'
                    sh 'sleep 5'
                    sh 'docker run --restart always -d -p 3002:3002 --name xyp_client_api --log-opt max-size=20m --log-opt max-file=5 --add-host xyp.gov.mn:10.12.0.12 -v /opt/projects/xyp_client_api:/opt/projects/xyp_client_api xyp_client_api'
                }
            }
        }
    }
}