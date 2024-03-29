import { AccessoryPlugin, API, Service, CharacteristicValue, Perms } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";

export class ValvePlatformAccessory implements AccessoryPlugin {

  private model: string = "Valve";

  private api: API;
  public service: Service;
  private information: Service;

  private subs: any[];
  public services: Service[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateActiveQueued: boolean;
  private updateInUseQueued: boolean;
  private updateRemainingDurationQueued: boolean;
  private updateSetDurationQueued: boolean;
  private updateIsConfiguredQueued: boolean;

  private accStates = {
    Active: 0,
    InUse: 0,
    ValveType: 0,
    RemainingDuration: 0,
    SetDuration: 0,
    IsConfigured: 0
  };

  name: string;

  constructor( api: API, platform: any, device: any, parent?: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.logging    = this.device.logging    || 0;

    this.subs = [];
    this.services = [];

    this.errorCheck();

    this.accStates.ValveType = this.device.valveType;

    if (parent) {
      this.service = new this.api.hap.Service.Valve(this.device.name, this.device.valveZone);
      this.service.setCharacteristic(this.platform.Characteristic.ServiceLabelIndex, this.device.valveZone);
      this.accStates.ValveType = 1;
    }
    else {
      this.service = new this.api.hap.Service.Valve(this.device.name);
    }
  
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setActive.bind(this))
      .onGet(this.getActive.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onGet(this.getInUse.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ValveType)
      .onGet(this.getValveType.bind(this));

    if (this.device.valveGetRemainingDuration) {
      this.service.getCharacteristic(this.platform.Characteristic.RemainingDuration)
        .onGet(this.getRemainingDuration.bind(this));
    }
    
    if (this.device.valveSetDuration && this.device.valveGetDuration) {
      this.service.getCharacteristic(this.platform.Characteristic.SetDuration)
        .setProps({minValue: 0, maxValue: 14400})
        .onSet(this.setSetDuration.bind(this))
        .onGet(this.getSetDuration.bind(this));
    }

    if (this.device.valveSetIsConfiguredOn && this.device.valveSetIsConfiguredOff && this.device.valveGetIsConfigured) {
      this.service.getCharacteristic(this.platform.Characteristic.IsConfigured)
        .setProps({perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE]})  
        .onSet(this.setIsConfigured.bind(this))
        .onGet(this.getIsConfigured.bind(this));
    }
    
    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.services.push(this.service, this.information);

    if (parent){
      parent.service.addLinkedService(this.service);
      parent.services.push(this.service);
    }

    this.updateActiveQueued = false;
    this.updateInUseQueued = false;
    this.updateRemainingDurationQueued = false;
    this.updateSetDurationQueued = false;
    this.updateIsConfiguredQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateActive();
        this.updateInUse();
        this.updateRemainingDuration();
        this.updateSetDuration();
        this.updateIsConfigured();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.valveGetActive || !this.device.valveSetActiveOn || !this.device.valveSetActiveOff || !this.device.valveGetInUse) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
    if (this.device.valveParentIrrigationSystem && !this.device.valveZone) {
      this.platform.log.error('[%s] zone parameter must be set to be included in an IrrigationSystem', this.device.name);
    }

  }

  getServices(): Service[] {
    return this.services;
  }

  async setActive(value: CharacteristicValue) {
    
    this.accStates.Active = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set Active <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.valveSetActiveOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.valveSetActiveOff, value as number, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async setSetDuration(value: CharacteristicValue) {

    if (this.device.valveSetDuration) {

      this.accStates.SetDuration = value as number;

      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] Set SetDuration <- %i', this.device.name, value);
      }

      let qItem: QueueSendItem = new QueueSendItem(this.device.valveSetDuration, this.accStates.SetDuration, 0);
      this.platform.queue.bequeue(qItem);
      
    }

  }

  async setIsConfigured(value: CharacteristicValue) {
    
    this.accStates.IsConfigured = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set Is Configured <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.valveSetIsConfiguredOn, 1, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.valveSetIsConfiguredOff, this.pushButton, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getActive(): Promise<CharacteristicValue> {
    
    const isActive = this.accStates.Active;
    this.updateActive();

    return isActive;
  }

  async getValveType(): Promise<CharacteristicValue> {
    
    const isValveType = this.accStates.ValveType;

    return isValveType;
  }

  async getInUse(): Promise<CharacteristicValue> {
    
    const isInUse = this.accStates.InUse;
    this.updateInUse();

    return isInUse;
  }

  async getRemainingDuration(): Promise<CharacteristicValue> {
    
    const isRemainingDuration = this.accStates.RemainingDuration;
    this.updateRemainingDuration();

    return isRemainingDuration;
  }

  async getSetDuration(): Promise<CharacteristicValue> {
    
    const isSetDuration = this.accStates.SetDuration;
    this.updateSetDuration();

    return isSetDuration;
  }

  async getIsConfigured(): Promise<CharacteristicValue> {
    
    const IsConfigured = this.accStates.IsConfigured;
    this.updateIsConfigured();

    return IsConfigured;
  }

  updateActive() {
    
    if (this.updateActiveQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.valveGetActive, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.Active = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Active -> %i', this.device.name, this.accStates.Active);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.Active, this.accStates.Active);
      }

      this.updateActiveQueued = false;

    });

    if(this.platform.queue.enqueue(qItem) === 1) {
      this.updateActiveQueued = true;
    }
  
  }

  updateInUse() {
    
    if (this.updateInUseQueued){return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.valveGetInUse, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.InUse = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get InUse -> %i', this.device.name, this.accStates.InUse);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.InUse, this.accStates.InUse);
      }

      this.updateInUseQueued = false;

    });

    if(this.platform.queue.enqueue(qItem) === 1) {
      this.updateInUseQueued = true;
    }

  }

  updateRemainingDuration() {

    if (this.device.valveGetRemainingDuration) {

      if (this.updateRemainingDurationQueued){return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.valveGetRemainingDuration, async (value: number) => {

        if (value != ErrorNumber.noData) {

          this.accStates.RemainingDuration = value as number;

          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RemainingDuration -> %i', this.device.name, this.accStates.RemainingDuration);
          }

          this.service.updateCharacteristic(this.api.hap.Characteristic.RemainingDuration, this.accStates.RemainingDuration);
        }

        this.updateRemainingDurationQueued = false;

      });

      if(this.platform.queue.enqueue(qItem) === 1) {
        this.updateRemainingDurationQueued = true;
      }
      
    }

  }

  updateSetDuration() {
    
    if (this.device.valveSetDuration && this.device.valveGetDuration) {
      
      if (this.updateSetDurationQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.valveGetDuration, async (value: number) => {

        if (value != ErrorNumber.noData) {

          this.accStates.SetDuration = value as number;

          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get SetDuration -> %i', this.device.name, this.accStates.SetDuration);
          }

          this.service.updateCharacteristic(this.api.hap.Characteristic.SetDuration, this.accStates.SetDuration);
        }

        this.updateSetDurationQueued = false;

      });

      if(this.platform.queue.enqueue(qItem) === 1) {
        this.updateSetDurationQueued = true;
      }

    }

  }

  updateIsConfigured() {
    
    if (this.device.valveSetIsConfiguredOn && this.device.valveSetIsConfiguredOff && this.device.valveGetIsConfigured) {
      
      if (this.updateIsConfiguredQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.valveGetIsConfigured, async (value: number) => {

        if (value != ErrorNumber.noData) {

          this.accStates.IsConfigured = value as number;

          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get IsConfigured -> %i', this.device.name, this.accStates.IsConfigured);
          }

          this.service.updateCharacteristic(this.api.hap.Characteristic.IsConfigured, this.accStates.IsConfigured);
        }

        this.updateIsConfiguredQueued = false;

      });

      if(this.platform.queue.enqueue(qItem) === 1) {
        this.updateIsConfiguredQueued = true;
      }

    }

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("Active",            this.accStates.Active,            InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("InUse",             this.accStates.InUse,             InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("RemainingDuration", this.accStates.RemainingDuration, InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("SetDuration",       this.accStates.SetDuration,       InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("IsConfigured",      this.accStates.IsConfigured,      InfluxDBFild.Int));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }

  }

}
