// each service must implement at-minimum the "required characteristics" for the given service type
// see https://developers.homebridge.io/#/service/Lightbulb

import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class SwitchPlatformAccessory implements AccessoryPlugin {

  private model: string = "Switch";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateOnQueued: boolean;

  private accStates = {
    On: false,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.logging    = this.device.logging    || 0;

    this.errorCheck();

    this.service = new this.api.hap.Service.Switch(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateOnQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateOn();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

  }

  errorCheck() {
    if (!this.device.switchGet || !this.device.switchSetOn || !this.device.switchSetOff) {
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
      qItem = new QueueSendItem(this.device.switchSetOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.switchSetOff, value as number, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  updateOn() {

    if (this.updateOnQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.switchGet, async (value: number) => {

      if (value != ErrorNumber.noData) {

        const on = value == 1 ? true : false;
        this.accStates.On = on;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, this.accStates.On);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, this.accStates.On);
      }

      this.updateOnQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateOnQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logBooleanValue(this.device.name, "On", this.accStates.On);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }
    
  }

}
