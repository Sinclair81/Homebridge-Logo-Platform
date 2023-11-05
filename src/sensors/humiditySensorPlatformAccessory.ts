import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";

export class HumiditySensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Humidity Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private logging: number;
  private updateCurrentRelativeHumidityQueued: boolean;

  private sensStates = {
    CurrentRelativeHumidity: 0,
    MinRelativeHumidity: 0,
    MaxRelativeHumidity: 100,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.errorCheck();

    this.service = new this.api.hap.Service.HumiditySensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity)
      .onGet(this.getCurrentRelativeHumidity.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateCurrentRelativeHumidityQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentRelativeHumidity();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.humidity) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getCurrentRelativeHumidity(): Promise<CharacteristicValue> {
    
    const isCurrentRelativeHumidity = this.sensStates.CurrentRelativeHumidity;
    this.updateCurrentRelativeHumidity();

    return isCurrentRelativeHumidity;
  }

  updateCurrentRelativeHumidity() {
    
    if (this.updateCurrentRelativeHumidityQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.humidity, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.CurrentRelativeHumidity = value as number;
        if (this.device.convertValue) {
          this.sensStates.CurrentRelativeHumidity = (value as number / 10);
        }
        if (this.sensStates.CurrentRelativeHumidity < this.sensStates.MinRelativeHumidity) {
          this.sensStates.CurrentRelativeHumidity = this.sensStates.MinRelativeHumidity;
        }
        if (this.sensStates.CurrentRelativeHumidity > this.sensStates.MaxRelativeHumidity) {
          this.sensStates.CurrentRelativeHumidity = this.sensStates.MaxRelativeHumidity;
        }

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentRelativeHumidity -> %f', this.device.name, this.sensStates.CurrentRelativeHumidity);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity, this.sensStates.CurrentRelativeHumidity);
      }

      this.updateCurrentRelativeHumidityQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentRelativeHumidityQueued = true;
    };

  }

}
