import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LogoHomebridgePlatform } from '../platform';
import { QueueItem } from "../queue";
import { md5 } from "../md5";


export class LightbulbPlatformAccessory {

  private model: string = "Lightbulb";

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
      .setCharacteristic(this.platform.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber,     md5(accessory.context.device.name + this.model))
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(this.getBrightness.bind(this));

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateBrightness();
      }, this.platform.config.updateInterval);

    }
    
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Set On <- %s', this.accessory.context.device.name, value);
    }

    let qItem: QueueItem;
    if (value) {
      qItem = new QueueItem(this.accessory.context.device.lightbulbSetOn, true, 1);
    } else {
      qItem = new QueueItem(this.accessory.context.device.lightbulbSetOff, true, 1);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;

    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    
    this.accStates.Brightness = value as number;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Set Brightness <- %i', this.accessory.context.device.name, value);
    }

    let qItem: QueueItem = new QueueItem(this.accessory.context.device.lightbulbSetBrightness, true, value as number);
    this.platform.queue.bequeue(qItem);

  }

  async getBrightness(): Promise<CharacteristicValue> {
    
    const isBrightness = this.accStates.Brightness;
    this.updateBrightness();

    return isBrightness;
  }

  updateBrightness() {
    
    let qItem: QueueItem = new QueueItem(this.accessory.context.device.lightbulbGetBrightness, false, 0, async (value: number) => {

      if (value != -1) {

        const on = value > 0 ? true : false;
        this.accStates.On         = on;
        this.accStates.Brightness = value as number;

        if (this.platform.config.debugMsgLog == true) {
          this.platform.log.info('[%s] Get On         -> %s', this.accessory.context.device.name, on);
          this.platform.log.info('[%s] Get Brightness -> %i', this.accessory.context.device.name, value);
        }

        this.service.updateCharacteristic(this.platform.Characteristic.On,         on);
        this.service.updateCharacteristic(this.platform.Characteristic.Brightness, value);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
