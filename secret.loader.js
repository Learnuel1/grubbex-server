const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const client = new SecretsManagerClient({ region: "us-north-1" });

async function loadSecrets(secretId) {
  const cmd = new GetSecretValueCommand({ SecretId: secretId });
  const res = await client.send(cmd);
  const secretString = res.SecretString;
  if (!secretString) throw new Error("env couldn't be loaded");
  try {
    const obj = JSON.parse(secretString);
          Object.assign(process.env, obj);
  } catch (error) { 
    throw new Error(error);
  }
}
module.exports = loadSecrets;
