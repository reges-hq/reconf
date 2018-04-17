const path = require('path');
const spawnSync = require('child_process').spawnSync;

const mapToProcess = parameters => {
  Object.keys(parameters).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = parameters[key];
    }
  });
};

module.exports = (config = {}) => {
  try {
    if (config.origin === 'aws') {
      if (!config.parameters || !Array.isArray(config.parameters)) {
        throw new TypeError('parameters are required for remote config');
      }

      if (!config.region) {
        throw new TypeError('region is required for remote config');
      }

      const result = spawnSync('node', [__dirname + '/syncssm'], {
        input: [config.region, ...config.parameters].join(','),
        maxBuffer: 4000000
      });

      const params = JSON.parse(result.stdout.toString());

      if (!params) {
        throw new Error('Could not load params');
      }

      if (params) {
        mapToProcess(
          params.reduce((state, next) => {
            state[next.Name] = next.Value;
            return state;
          }, {})
        );
      }
    } else {
      const env = require(path.resolve(process.cwd(), '.env.json'));
      mapToProcess(env);
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};
