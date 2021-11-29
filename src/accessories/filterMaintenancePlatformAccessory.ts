import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class FilterMaintenancePlatformAccessory implements AccessoryPlugin {

  private model: string = "Filter Maintenance";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    FilterChangeIndication: 0,
    FilterLifeLevel: 0,
    ResetFilterIndication: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

    this.errorCheck();

    this.service = new this.api.hap.Service.FilterMaintenance(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
      .onGet(this.getFilterChangeIndication.bind(this));
    
    if (this.device.filterLifeLevel) {
      this.service.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
        .onGet(this.getFilterLifeLevel.bind(this));
    }

    if (this.device.filterResetFilterIndication) {
      this.service.getCharacteristic(this.platform.Characteristic.ResetFilterIndication)
        .onSet(this.setResetFilterIndication.bind(this));
    }
    
    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateFilterChangeIndication();
        this.updateFilterLifeLevel();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.filterChangeIndication) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setResetFilterIndication(value: CharacteristicValue) {
    
    this.accStates.ResetFilterIndication = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set ResetFilterIndication <- %s', this.device.name, value);
    }

    let qItem: QueueItem = new QueueItem(this.device.filterResetFilterIndication, true, this.accStates.ResetFilterIndication);
      this.platform.queue.bequeue(qItem);

  }

  async getFilterChangeIndication(): Promise<CharacteristicValue> {
    
    const isFilterChangeIndication = this.accStates.FilterChangeIndication;
    this.updateFilterChangeIndication();

    return isFilterChangeIndication;
  }

  async getFilterLifeLevel(): Promise<CharacteristicValue> {
    
    const isFilterLifeLevel = this.accStates.FilterLifeLevel;
    this.updateFilterLifeLevel();

    return isFilterLifeLevel;
  }

  updateFilterChangeIndication() {
    
    let qItem: QueueItem = new QueueItem(this.device.filterChangeIndication, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.FilterChangeIndication = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get FilterChangeIndication -> %s', this.device.name, this.accStates.FilterChangeIndication);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.FilterChangeIndication, this.accStates.FilterChangeIndication);
      }

    });

    this.platform.queue.enqueue(qItem);
  
  }

  updateFilterLifeLevel() {

    if (this.device.filterLifeLevel) {

      let qItem: QueueItem = new QueueItem(this.device.filterLifeLevel, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.accStates.FilterLifeLevel = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get FilterLifeLevel -> %i', this.device.name, this.accStates.FilterLifeLevel);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.FilterLifeLevel, this.accStates.FilterLifeLevel);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);
      
    }

  }

}
