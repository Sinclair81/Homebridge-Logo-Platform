import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class LightbulbPlatformAccessory implements AccessoryPlugin {

  private model: string = "Lightbulb";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    On: false,
    Brightness: 100,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.service = new this.api.hap.Service.Lightbulb(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(this.getBrightness.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateOn();
        this.updateBrightness();
      }, this.platform.config.updateInterval);

    }
    
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Set On <- %s', this.device.name, value);
    }

    let qItem: QueueItem;
    if (value) {
      qItem = new QueueItem(this.device.lightbulbSetOn, true, 1);
    } else {
      qItem = new QueueItem(this.device.lightbulbSetOff, true, 1);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    
    this.accStates.Brightness = value as number;

    if (this.platform.config.debugMsgLog == true) {
      this.platform.log.info('[%s] Set Brightness <- %i', this.device.name, value);
    }

    let qItem: QueueItem = new QueueItem(this.device.lightbulbSetBrightness, true, value as number);
    this.platform.queue.bequeue(qItem);

  }

  async getBrightness(): Promise<CharacteristicValue> {
    
    const isBrightness = this.accStates.Brightness;
    this.updateBrightness();

    return isBrightness;
  }

  updateOn() {
    
    let qItem: QueueItem = new QueueItem(this.device.lightbulbGet, false, 0, async (value: number) => {

      if (value != -1) {

        const on = value > 0 ? true : false;
        this.accStates.On = on;

        if (this.platform.config.debugMsgLog == true) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, on);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, on);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateBrightness() {
    
    let qItem: QueueItem = new QueueItem(this.device.lightbulbGetBrightness, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.Brightness = value as number;

        if (this.platform.config.debugMsgLog == true) {
          this.platform.log.info('[%s] Get Brightness -> %i', this.device.name, value);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.Brightness, value);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
