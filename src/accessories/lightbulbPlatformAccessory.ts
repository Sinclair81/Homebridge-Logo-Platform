import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";

export class LightbulbPlatformAccessory implements AccessoryPlugin {

  private model: string = "Lightbulb";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private updateOnQueued: boolean;
  private updateBrightnessQueued: boolean;

  private accStates = {
    On: false,
    Brightness: 100,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = (this.device.pushButton ? 1 : 0) || this.platform.pushButton;

    this.errorCheck();

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

    this.updateBrightnessQueued = false;
    this.updateOnQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateOn();
        this.updateBrightness();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.lightbulbGet || !this.device.lightbulbSetOn || !this.device.lightbulbSetOff || !this.device.lightbulbSetBrightness || !this.device.lightbulbGetBrightness) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set On <- %s', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.lightbulbSetOn, value, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.lightbulbSetOff, value, this.pushButton);
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

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set Brightness <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.lightbulbSetBrightness, value as number, 0);
    this.platform.queue.bequeue(qItem);

  }

  async getBrightness(): Promise<CharacteristicValue> {
    
    const isBrightness = this.accStates.Brightness;
    this.updateBrightness();

    return isBrightness;
  }

  updateOn() {
    
    if (this.updateOnQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.lightbulbGet, async (value: number) => {

      if (value != ErrorNumber.noData) {

        const on = value > 0 ? true : false;
        this.accStates.On = on;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, on);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, on);
      }

      this.updateOnQueued = false;
      
    });

    if(this.platform.queue.enqueue(qItem) === 1) {
      this.updateOnQueued = true;
    }

  }

  updateBrightness() {
    
    if(this.updateBrightnessQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.lightbulbGetBrightness, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.Brightness = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Brightness -> %i', this.device.name, value);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.Brightness, value);
      }

      this.updateBrightnessQueued = false;

    });

    if(this.platform.queue.enqueue(qItem) === 1) {
      this.updateBrightnessQueued = true;
    }

  }

}
