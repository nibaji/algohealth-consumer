module.exports = ({ config }) => {
  const isDev = process.env.APP_ENV === 'development' || process.env.EAS_BUILD_PROFILE === 'development';

  const bundleId = isDev 
    ? 'com.algohealthplus.consumer.dev' 
    : 'com.algohealthplus.consumer';

  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: bundleId,
    },
    android: {
      ...config.android,
      package: bundleId,
    },
  };
};
