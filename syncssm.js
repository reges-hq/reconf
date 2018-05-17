const AWS = require("aws-sdk");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const chunkArray = (arr, chunk_size) => {
  let index = 0;
  let arrayLength = arr.length;
  let tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = arr.slice(index, index + chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
};

const getParametersAsync = (ssm, config) =>
  new Promise((resolve, reject) => {
    ssm.getParameters(config, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data.Parameters);
    });
  });

rl.on("line", async input => {
  try {
    let args = input.split(",");
    let region = args.shift();

    AWS.config.update({ region: region });

    const ssm = new AWS.SSM();
    const paramChunks = chunkArray(args, 10);
    const loadedParameters = [];

    for (let chunk of paramChunks) {
      loadedParameters.push(
        ...(await getParametersAsync(ssm, {
          Names: [...chunk],
          WithDecryption: true
        }))
      );
    }
    
    console.log(JSON.stringify(loadedParameters));
  } catch (err) {
    console.log(undefined);
  } finally {
    rl.close();
  }
});
