# infrastructure

$ terraform init
$ terraform apply 
$ terraform destroy

$ aws acm import-certificate --certificate fileb://Certificate.pem \ --certificate-chain fileb://CertificateChain.pem \   --private-key fileb://PrivateKey.pem 

1. The PEM-encoded certificate is stored in a file named Certificate.pem.
2. The PEM-encoded certificate chain is stored in a file named CertificateChain.pem.
3. The PEM-encoded, unencrypted private key is stored in a file named PrivateKey.pem.

