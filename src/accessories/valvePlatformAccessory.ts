import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class ValvePlatformAccessory implements AccessoryPlugin {

  private model: string = "Valve";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    Active: 0,
    InUse: 0,
    ValveType: 0,
    RemainingDuration: 0,
    SetDuration: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.errorCheck();

    this.accStates.ValveType = this.device.valveType;

    this.service = new this.api.hap.Service.Valve(this.device.name);

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
        .onSet(this.setSetDuration.bind(this))
        .onGet(this.getSetDuration.bind(this));
    }
    
    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateActive();
        this.updateInUse();
        this.updateRemainingDuration();
        this.updateSetDuration();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.valveGetActive || !this.device.valveSetActiveOn || !this.device.valveSetActiveOff || !this.device.valveGetInUse || !this.device.valveType) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setActive(value: CharacteristicValue) {
    
    this.accStates.Active = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set Active <- %i', this.device.name, value);
    }

    let qItem: QueueItem;
    if (value) {
      qItem = new QueueItem(this.device.valveSetActiveOn, true, 1);
    } else {
      qItem = new QueueItem(this.device.valveSetActiveOff, true, 1);
    }
    this.platform.queue.bequeue(qItem);

  }

  async setSetDuration(value: CharacteristicValue) {

    if (this.device.valveSetDuration) {

      this.accStates.SetDuration = value as number;

      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] Set SetDuration <- %i', this.device.name, value);
      }

      let qItem: QueueItem = new QueueItem(this.device.valveSetDuration, true, this.accStates.SetDuration);
      this.platform.queue.bequeue(qItem);
      
    }

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

  updateActive() {
    
    let qItem: QueueItem = new QueueItem(this.device.valveGetActive, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.Active = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Active -> %i', this.device.name, this.accStates.Active);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.Active, this.accStates.Active);
      }

    });

    this.platform.queue.enqueue(qItem);
  
  }

  updateInUse() {
    
    let qItem: QueueItem = new QueueItem(this.device.valveGetInUse, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.InUse = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get InUse -> %i', this.device.name, this.accStates.InUse);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.InUse, this.accStates.InUse);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateRemainingDuration() {

    if (this.device.valveGetRemainingDuration) {

      let qItem: QueueItem = new QueueItem(this.device.valveGetRemainingDuration, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.accStates.RemainingDuration = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RemainingDuration -> %i', this.device.name, this.accStates.RemainingDuration);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.RemainingDuration, this.accStates.RemainingDuration);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);
      
    }

  }

  updateSetDuration() {
    
    if (this.device.valveGetDuration) {
      
      let qItem: QueueItem = new QueueItem(this.device.valveGetDuration, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.accStates.SetDuration = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get SetDuration -> %i', this.device.name, this.accStates.SetDuration);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.SetDuration, this.accStates.SetDuration);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);

    }

  }

}
