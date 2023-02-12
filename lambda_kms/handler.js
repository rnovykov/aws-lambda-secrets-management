const AWS = require('aws-sdk');
const kms = new AWS.KMS();

exports.handler = async (event) => {
  const secret = process.env.SECRET_NAME;
  const encryptedSecret = process.env[secret];
  
  const decryptedSecret = await kms
    .decrypt({ CiphertextBlob: Buffer.from(encryptedSecret, 'base64') })
    .promise()
    .then(data => data.Plaintext.toString('ascii'))
    .catch(err => {
      console.log(`Error: ${err}`);
      return '';
    });
    
  console.log(`The decrypted secret is: ${decryptedSecret}`);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
};