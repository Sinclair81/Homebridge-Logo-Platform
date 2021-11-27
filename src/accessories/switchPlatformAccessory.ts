// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LogoHomebridgePlatform } from '../platform';
import { QueueItem } from "../queue";
import { md5 } from "../md5";


export class SwitchPlatformAccessory {

  private model: string = "Switch";

  private service: Service;

  private accStates = {
    On: false,
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

    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateOn();
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
      qItem = new QueueItem(this.accessory.context.device.switchSetOn, true, 1);
    } else {
      qItem = new QueueItem(this.accessory.context.device.switchSetOff, true, 1);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  updateOn() {
    
    let qItem: QueueItem = new QueueItem(this.accessory.context.device.switchGet, false, 0, async (value: number) => {

      if (value != -1) {

        const on = value == 1 ? true : false;
        this.accStates.On = on;

        if (this.platform.config.debugMsgLog == true) {
          this.platform.log.info('[%s] Get On -> %s', this.accessory.context.device.name, on);
        }

        this.service.updateCharacteristic(this.platform.Characteristic.On, on);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
