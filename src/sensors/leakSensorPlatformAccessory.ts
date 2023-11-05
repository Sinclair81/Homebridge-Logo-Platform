import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class LeakSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Leak Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private logging: number;
  private updateLeakDetectedQueued: boolean;
  private updateWaterLevelQueued: boolean;

  private sensStates = {
    LeakDetected: 0,
    WaterLevel: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.errorCheck();

    this.service = new this.api.hap.Service.LeakSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.LeakDetected)
      .onGet(this.getLeakDetected.bind(this));

    if (this.device.waterLevel) {
      this.service.getCharacteristic(this.api.hap.Characteristic.WaterLevel)
        .onGet(this.getWaterLevel.bind(this));
    }

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateLeakDetectedQueued = false;
    this.updateWaterLevelQueued = false;
    
    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateLeakDetected();
        this.updateWaterLevel();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.leak) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getLeakDetected(): Promise<CharacteristicValue> {
    
    const isLeakDetected = this.sensStates.LeakDetected;
    this.updateLeakDetected();

    return isLeakDetected;
  }

  async getWaterLevel(): Promise<CharacteristicValue> {
    
    const isWaterLevel = this.sensStates.WaterLevel;
    this.updateWaterLevel();

    return isWaterLevel;
  }

  updateLeakDetected() {
  
    if (this.updateLeakDetectedQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.leak, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.LeakDetected = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get LeakDetected -> %i', this.device.name, this.sensStates.LeakDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.LeakDetected, this.sensStates.LeakDetected);
      }

      this.updateLeakDetectedQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateLeakDetectedQueued = true;
    };

  }

  updateWaterLevel() {

    if (this.device.waterLevel) {

      if (this.updateWaterLevelQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.waterLevel, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.sensStates.WaterLevel = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get WaterLevel -> %f', this.device.name, this.sensStates.WaterLevel);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.WaterLevel, this.sensStates.WaterLevel);
        }

        this.updateWaterLevelQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateWaterLevelQueued = true;
      };

    }

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("LeakDetected", this.sensStates.LeakDetected, InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("WaterLevel",   this.sensStates.WaterLevel,   InfluxDBFild.Int));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }

  }

}
