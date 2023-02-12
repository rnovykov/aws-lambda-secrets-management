const AWS = require('aws-sdk');
const axios = require('axios');

const iam = new AWS.IAM();

exports.handler = async (event) => {
  const vaultUrl = process.env.VAULT_URL;
  const secretPath = process.env.SECRET_PATH;
  
  // Retrieve the IAM role ARN
  const roleArn = process.env.IAM_ROLE_ARN;
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;

  // Generate a Vault token using the IAM role
  const roleId = await iam
    .getRole({ RoleName: roleArn.split('/')[1] })
    .promise()
    .then(data => data.Role.RoleId)
    .catch(err => {
      console.log(`Error retrieving role ID: ${err}`);
      return '';
    });
  
  const policy = `
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
`;
  
  await iam
    .putRolePolicy({
      PolicyDocument: policy,
      PolicyName: `${roleArn.split('/')[1]}-policy`,
      RoleName: roleArn.split('/')[1],
    })
    .promise()
    .catch(err => {
      console.log(`Error putting role policy: ${err}`);
    });

  const assumeRoleResponse = await iam
    .assumeRole({
      RoleArn: roleArn,
      RoleSessionName: functionName,
    })
    .promise()
    .catch(err => {
      console.log(`Error assuming role: ${err}`);
      return {};
    });

  const vaultToken = assumeRoleResponse.Credentials.AccessKeyId;
  
  // Retrieve the secret from Vault
  const secret = await axios
    .get(`${vaultUrl}/v1/${secretPath}`, { headers: { 'X-Vault-Token': vaultToken } })
    .then(response => response.data.data)
    .catch(err => {
      console.log(`Error: ${err}`);
      return {};
    });
    
  console.log(`The secret is: ${JSON.stringify(secret)}`);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
};