// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class HumiditySensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Humidity Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

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

    this.service = new this.api.hap.Service.HumiditySensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity)
      .onGet(this.getCurrentRelativeHumidity.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentRelativeHumidity();
      }, this.platform.config.updateInterval);

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
    
    let qItem: QueueItem = new QueueItem(this.device.humidity, false, 0, async (value: number) => {

      if (value != -1) {

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
          this.platform.log.info('[%s] Get CurrentRelativeHumidity -> %i', this.device.name, this.sensStates.CurrentRelativeHumidity);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity, this.sensStates.CurrentRelativeHumidity);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

}
