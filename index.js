const fs = require("fs");
const path = require("path");
const spawnSync = require("child_process").spawnSync;

const spawnSSMProcess = (region, parametersToLoad) => {
  const result = spawnSync("node", [__dirname + "/syncssm"], {
    input: [region, ...parametersToLoad].join(","),
    maxBuffer: 4000000
  });

  const params = JSON.parse(result.stdout.toString());

  if (!params) {
    throw new Error("Could not load params");
  }

  return params;
}

module.exports = (config = {}) => {
  try {
    let loadFromFile = false;
    let secrets = {};
    let params;
    const configurationsToLoad = [];
    const currentEnvironment = process.env.NODE_ENV;
    const defaultConfigPath = path.resolve(process.cwd(), '.env.json');

    if (!{}.hasOwnProperty.call(config, "useLocal")) config.useLocal = true;
    if (!{}.hasOwnProperty.call(config, "region")) config.region = "eu-west-1";
    if (config.useLocal) loadFromFile = fs.existsSync(defaultConfigPath);

    if ({}.hasOwnProperty.call(config, "default"))
      configurationsToLoad.push("default");
    if (
      {}.hasOwnProperty.call(config, "environments") &&
      {}.hasOwnProperty.call(config.environments, currentEnvironment)
    )
      configurationsToLoad.push(currentEnvironment);

    if (loadFromFile) {
      const parametersToLoad = [];

      for (let configuration of configurationsToLoad) {
        if (
          configuration === "default" &&
          {}.hasOwnProperty.call(config.default, "parameters")
        ) {
          parametersToLoad.push(...config.default.parameters);
        } else if (
          {}.hasOwnProperty.call(
            config.environments[currentEnvironment],
            "parameters"
          )
        ) {
          parametersToLoad.push(
            ...config.environments[currentEnvironment].parameters
          );
        }
      }

      const configFile = require(defaultConfigPath);
      for (let param of parametersToLoad) {
        if (configFile[param.key]) {
          process.env[param.name] = configFile[param.key];
        }
      }
    } else {
      const parametersToLoad = [];

      for (let configuration of configurationsToLoad) {
        if (
          configuration === "default" &&
          {}.hasOwnProperty.call(config.default, "parameters")
        ) {
          let region;
          if (!{}.hasOwnProperty.call(config.default, "region") && !config.region) region = "eu-west-1";
          if(!region) region = config.region;

          const parameters = spawnSSMProcess(region, config.default.parameters.map(p => p.key));          
          for(let param of parameters) {
            const specParam = config.default.parameters.find(p => p.key === param.Name);
            if(specParam) {
              process.env[specParam.name] = param.Value; 
            }
          }
        } else if (
          {}.hasOwnProperty.call(
            config.environments[currentEnvironment],
            "parameters"
          )
        ) {
          let region;
          if (!{}.hasOwnProperty.call(config.environments[currentEnvironment], "region") && !config.region) region = "eu-west-1";
          if(!region) region = config.region;

          const parameters = spawnSSMProcess(region, config.environments[currentEnvironment].parameters.map(p => p.key));     
          for(let param of parameters) {
            const specParam = config.environments[currentEnvironment].parameters.find(p => p.key === param.Name);
            if(specParam) {
              process.env[specParam.name] = param.Value; 
            }
          }
        }
      }
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};
