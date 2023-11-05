// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';
import { md5 } from "../md5";

export class LogSwitchPlatformAccessory implements AccessoryPlugin {

  private model: string = "Logger Switch";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    On: false,
  };

  name: string;

  constructor( api: API, platform: any, device: any, parent: any ) {

    this.name              = device.name + '-Logger';
    this.api               = api;
    this.platform          = platform;
    this.device            = device;

    this.service = new this.api.hap.Service.Switch(this.name);
    // this.service.setCharacteristic(this.platform.Characteristic.ServiceLabelIndex, '1');

    this.service.subtype = 'logger';

    this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    parent.service.addLinkedService(this.service);
    parent.services.push(this.service);

  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] [%s] Set On <- %s', this.device.name, this.name, value);
    }

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] [%s] Get On -> %s', this.device.name, this.name, this.accStates.On);
    }

    return isOn;
  }

}
