import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

import { ModBusLogo } from "./modbus-logo";
import { Queue, QueueItem } from "./queue";

import { SwitchPlatformAccessory } from './accessories/switchPlatformAccessory';
import { LightbulbPlatformAccessory } from './accessories/lightbulbPlatformAccessory';

// const pjson   = require('../package.json');


export class LogoHomebridgePlatform implements DynamicPlatformPlugin {
  
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  public logo: ModBusLogo;
  public queue: Queue;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    // this.log.debug('Finished initializing platform:', this.config.name);

    this.logo  = new ModBusLogo(this.config.ip, this.config.port, this.config.debugMsgLog, this.log, (this.config.retryCount + 1));
    this.queue = new Queue();

    this.api.on('didFinishLaunching', () => {
      // log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });

    setInterval(() => {
      this.sendQueueItems();
    }, 100);

  }

  configureAccessory(accessory: PlatformAccessory) {
    // this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {

    if (Array.isArray(this.config.devices)) {

      const configDevices = this.config.devices;

      for (const device of configDevices) {

        const uuid = this.api.hap.uuid.generate(device.name.toLowerCase().trim());
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {

          if (this.config.debugMsgLog == true) {
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
          }
          existingAccessory.context.device = device;
          this.api.updatePlatformAccessories([existingAccessory]);
          generateNewPlatformAccessory(this, existingAccessory, device.type);
          
        } else {

          if (this.config.debugMsgLog == true) {
            this.log.info('Adding new accessory:', device.name);
          }
          const accessory = new this.api.platformAccessory(device.name, uuid);
          accessory.context.device = device;
          generateNewPlatformAccessory(this, accessory, device.type);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

        }
      }
    }

    for (const acc of this.accessories) {

      let findAcc = false;

      for(const a of this.config.devices) {
        if (acc.displayName === a.name) {
          findAcc = true;
        }
      }

      if (findAcc == false) {
        if (this.config.debugMsgLog == true) {
          this.log.info('Removing existing accessory from cache:', acc.displayName);
        }
        generateNewPlatformAccessory(this, acc, acc.context.device.type);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [acc]);
      }
    }
  }

  sendQueueItems() {

    if (this.queue.count() > 0) {
      
      const item: QueueItem = this.queue.dequeue();
      if (item.send) {
        this.logo.WriteLogo(item.address, item.value);
      } else {
        this.logo.ReadLogo(item.address, item.callBack);
      }
      
    }
  }
  
}

function generateNewPlatformAccessory(platform: LogoHomebridgePlatform, accessory: any, type: String, ) {

  switch (type) {
    case "switch":
      new SwitchPlatformAccessory(platform, accessory);
      break;

    case "lightbulb":
      new LightbulbPlatformAccessory(platform, accessory);
      break;
  
    default:
      new SwitchPlatformAccessory(platform, accessory);
      break;
  }

}

