import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class LightbulbPlatformAccessory implements AccessoryPlugin {

  private model: string = "Lightbulb";

  private api: API;
  private service: Service;
  private information: Service;

  private fakegatoService: any;
  public services: Service[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
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
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.logging    = this.device.logging    || 0;

    this.fakegatoService = [];
    this.services = [];

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

    this.services.push(this.service, this.information);

    this.updateBrightnessQueued = false;
    this.updateOnQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateOn();
        this.updateBrightness();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {

      if (this.platform.loggerType == LoggerType.Fakegato) {
        this.fakegatoService = new this.platform.FakeGatoHistoryService("custom", this, {storage: 'fs'});
        this.services.push(this.fakegatoService);
      }

      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.lightbulbGet || !this.device.lightbulbSetOn || !this.device.lightbulbSetOff || !this.device.lightbulbSetBrightness || !this.device.lightbulbGetBrightness) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set On <- %s', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.lightbulbSetOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.lightbulbSetOff, value as number, this.pushButton);
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
          this.platform.log.info('[%s] Get On -> %s', this.device.name, this.accStates.On);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, this.accStates.On);
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
          this.platform.log.info('[%s] Get Brightness -> %i', this.device.name, this.accStates.Brightness);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.Brightness, this.accStates.Brightness);
      }

      this.updateBrightnessQueued = false;

    });

    if(this.platform.queue.enqueue(qItem) === 1) {
      this.updateBrightnessQueued = true;
    }

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("On",         this.accStates.On,         InfluxDBFild.Bool));
      logItems.push(new InfluxDBLogItem("Brightness", this.accStates.Brightness, InfluxDBFild.Int));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), status: this.accStates.On});

    }

  }

}
