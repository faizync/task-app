Download the AWS RDS CA certificate and place it here as aws-rds-ca.pem

Run this command on the backend EC2:
  mkdir -p /home/ubuntu/certs
  wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /home/ubuntu/certs/aws-rds-ca.pem
