module.exports = ({ config }) => {
  const isDev = process.env.APP_ENV === 'development' || process.env.EAS_BUILD_PROFILE === 'development';

  const appName = isDev
    ? `${config.name} Dev`
    : config.name;

  const bundleId = isDev 
    ? 'com.algohealthplus.consumer.dev' 
    : 'com.algohealthplus.consumer';
  const googleServicesFile = isDev
    ? './google-services.dev.json'
    : './google-services.prod.json';

  return {
    ...config,
    name: appName,
    ios: {
      ...config.ios,
      bundleIdentifier: bundleId,
    },
    android: {
      ...config.android,
      package: bundleId,
      googleServicesFile,
    },
  };
};
