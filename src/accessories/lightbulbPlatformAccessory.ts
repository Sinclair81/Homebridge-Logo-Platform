// each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LogoHomebridgePlatform } from '../platform';


export class LightbulbPlatformAccessory {
  private service: Service;

  private accStates = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: LogoHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model,        'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));       // SET - bind to the 'setBrightness` method below

  }

  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Set Characteristic On -> %s', this.accessory.context.device.name, value);
    }
  }

  /**
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.
   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.accStates.On;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Get Characteristic On -> %s', this.accessory.context.device.name, isOn);
    }

    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    this.accStates.Brightness = value as number;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Set Characteristic Brightness -> %i', this.accessory.context.device.name, value);
    }
  }

}
