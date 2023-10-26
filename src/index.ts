import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
// import { LogoHomebridgePlatform } from './platform';
import { LogoHomebridgePlatform_MB_S7 } from './platform_mb_s7';
import { LogoHomebridgePlatform_MB }    from './platform_mb';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  // api.registerPlatform(PLATFORM_NAME, LogoHomebridgePlatform);

  const [major, minor, patch] = process.versions.node.split('.').map(Number);

  if (major > 10) {
    api.registerPlatform(PLATFORM_NAME, LogoHomebridgePlatform_MB);
  } else {
    api.registerPlatform(PLATFORM_NAME, LogoHomebridgePlatform_MB_S7);
  }

};
