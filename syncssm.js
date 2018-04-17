const AWS = require('aws-sdk');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', input => {
  try {
    let args = input.split(',');
    let region = args.shift();

    AWS.config.update({ region: region });
    const ssm = new AWS.SSM();

    ssm.getParameters(
      {
        Names: [...args],
        WithDecryption: true
      },
      (err, data) => {
        if (data) {
          console.log(JSON.stringify(data.Parameters));
        }
      }
    );
  } catch (err) {
    console.log(undefined);
  } finally {
    rl.close();
  }
});
