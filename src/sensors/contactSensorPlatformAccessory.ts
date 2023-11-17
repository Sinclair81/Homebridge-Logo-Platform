import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class ContactSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Contact Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private fakegatoService: any;
  public services: Service[];

  private platform: any;
  private device: any;
  private logging: number;
  private updateContactSensorStateQueued: boolean;

  private sensStates = {
    ContactSensorState: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.fakegatoService = [];
    this.services = [];

    this.errorCheck();

    this.service = new this.api.hap.Service.ContactSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
      .onGet(this.getContactSensorState.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.services.push(this.service, this.information);

    this.updateContactSensorStateQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateContactSensorState();
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
    if (!this.device.contact) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async getContactSensorState(): Promise<CharacteristicValue> {
    
    const isContactSensorState = this.sensStates.ContactSensorState;
    this.updateContactSensorState();

    return isContactSensorState;
  }

  updateContactSensorState() {
    
    if (this.updateContactSensorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.contact, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.ContactSensorState = (value as number == 1 ? 0 : 1) ;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get ContactSensorState -> %i', this.device.name, this.sensStates.ContactSensorState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.ContactSensorState, this.sensStates.ContactSensorState);
      }

      this.updateContactSensorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateContactSensorStateQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      this.platform.influxDB.logIntegerValue(this.device.name, "ContactSensorState", this.sensStates.ContactSensorState);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), contact: this.sensStates.ContactSensorState});

    }
    
  }

}
