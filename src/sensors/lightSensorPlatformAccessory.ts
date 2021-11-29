import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { md5 } from "../md5";

export class LightSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Light Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private sensStates = {
    MinAmbientLightLevel:     0.0001,
    MaxAmbientLightLevel:     100000,
    CurrentAmbientLightLevel: 0.0001,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.errorCheck();

    this.service = new this.api.hap.Service.LightSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentAmbientLightLevel)
      .onGet(this.getCurrentAmbientLightLevel.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentAmbientLightLevel();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.light) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getCurrentAmbientLightLevel(): Promise<CharacteristicValue> {
    
    const isCurrentAmbientLightLevel = this.sensStates.CurrentAmbientLightLevel;
    this.updateCurrentAmbientLightLevel();

    return isCurrentAmbientLightLevel;
  }

  updateCurrentAmbientLightLevel() {
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.light, async (value: number) => {

      if (value != -1) {

        this.sensStates.CurrentAmbientLightLevel = value as number;
        if (this.sensStates.CurrentAmbientLightLevel < this.sensStates.MinAmbientLightLevel) {
          this.sensStates.CurrentAmbientLightLevel = this.sensStates.MinAmbientLightLevel
        }
        if (this.sensStates.CurrentAmbientLightLevel > this.sensStates.MaxAmbientLightLevel) {
          this.sensStates.CurrentAmbientLightLevel = this.sensStates.MaxAmbientLightLevel
        }

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentAmbientLightLevel -> %i', this.device.name, this.sensStates.CurrentAmbientLightLevel);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentAmbientLightLevel, this.sensStates.CurrentAmbientLightLevel);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
