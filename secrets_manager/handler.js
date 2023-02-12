const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
exports.handler = async (event) => {
  const secretName = process.env.SECRET_NAME;
  
  const secret = await secretsManager
    .getSecretValue({ SecretId: secretName })
    .promise()
    .then(data => JSON.parse(data.SecretString))
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