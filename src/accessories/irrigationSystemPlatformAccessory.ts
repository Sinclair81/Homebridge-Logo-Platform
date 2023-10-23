import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";
import { ValvePlatformAccessory } from './valvePlatformAccessory';


export class IrrigationSystemPlatformAccessory implements AccessoryPlugin {

  private model: string = "IrrigationSystem";

  private api: API;
  service: Service;
  private information: Service;
  private valveAccessories: any[];
  servicesArray: Service[];
  private valveZones: number[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private irrigationSystemAutoUpdate: number;
  private updateActiveQueued: boolean;
  private updateProgramModeQueued: boolean;
  private updateInUseQueued: boolean;

  private accStates = {
    Active: 0,
    ProgramMode: 0,
    InUse: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = (this.device.pushButton ? 1 : 0) || this.platform.pushButton;
    this.irrigationSystemAutoUpdate = (this.device.irrigationSystemAutoUpdate ? 1 : 0);
    this.valveAccessories = [];
    this.servicesArray = [];
    this.valveZones = [];

    this.errorCheck();

    this.service = new this.api.hap.Service.IrrigationSystem(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setActive.bind(this))
      .onGet(this.getActive.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ProgramMode)
      .onGet(this.getProgramMode.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onGet(this.getInUse.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.servicesArray.push(this.service, this.information);
    
    const configDevices = this.platform.config.devices;

    for (const dev of configDevices) {
      if ((dev.type == "valve") && (dev.valveParentIrrigationSystem == this.name)) {
        if (this.valveZones.includes(dev.valveZone)) {
          this.platform.log.error('[%s] zone number [%d] already used on [%s] irrigation system!', dev.name, dev.valveZone, this.name);
        }
        else {
          this.valveZones.push(dev.valveZone);
        }
        this.valveAccessories.push(new ValvePlatformAccessory(api, platform, dev, this));
      }
    }

    this.updateActiveQueued = false;
    this.updateProgramModeQueued = false;
    this.updateInUseQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateActive();
        this.updateProgramMode();
        this.updateInUse();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!(this.device.irrigationSystemGetActive || this.device.irrigationSystemAutoUpdate) || !this.device.irrigationSystemSetActiveOn || 
        !this.device.irrigationSystemSetActiveOff || !this.device.irrigationSystemGetProgramMode || !(this.device.irrigationSystemGetInUse || this.device.irrigationSystemAutoUpdate)) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.servicesArray;
  }

  async setActive(value: CharacteristicValue) {
    
    this.accStates.Active = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set Active <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.irrigationSystemSetActiveOn, 1, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.irrigationSystemSetActiveOff, 1, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async getActive(): Promise<CharacteristicValue> {
    
    const isActive = this.accStates.Active;
    this.updateActive();

    return isActive;
  }

  async getProgramMode(): Promise<CharacteristicValue> {
    
    const isProgramMode = this.accStates.ProgramMode;
    this.updateProgramMode();

    return isProgramMode;
  }

  async getInUse(): Promise<CharacteristicValue> {
    
    const isInUse = this.accStates.InUse;
    this.updateInUse();

    return isInUse;
  }

  updateActive() {
    if(this.irrigationSystemAutoUpdate) {

      let isActive: number = 0;
      for (const dev of this.valveAccessories) {
        isActive |= dev.getActive();
      }
      this.accStates.Active = isActive;

    }

    else {

      if (this.updateActiveQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.irrigationSystemGetActive, async (value: number) => {

        if (value != ErrorNumber.noData) {

          this.accStates.Active = value as number;

          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get Active -> %i', this.device.name, this.accStates.Active);
          }

          this.service.updateCharacteristic(this.api.hap.Characteristic.Active, this.accStates.Active);
        }

        this.updateActiveQueued = false;

      });

      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateActiveQueued = true;
      };
    };

  }

  updateProgramMode() {

    if (this.updateProgramModeQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.irrigationSystemGetProgramMode, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.ProgramMode = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get ProgramMode -> %i', this.device.name, this.accStates.ProgramMode);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.ProgramMode, this.accStates.ProgramMode);
      }

      this.updateProgramModeQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateProgramModeQueued = true;
    };

  }

  updateInUse() {

    if(this.irrigationSystemAutoUpdate) {

      let isInUse: number = 0;
      for (const dev of this.valveAccessories) {
        isInUse |= dev.getInUse();
      }
      this.accStates.InUse = isInUse;
      
    }

    else {

      if (this.updateInUseQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.irrigationSystemGetInUse, async (value: number) => {

        if (value != ErrorNumber.noData) {

          this.accStates.InUse = value as number;

          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get InUse -> %i', this.device.name, this.accStates.InUse);
          }

          this.service.updateCharacteristic(this.api.hap.Characteristic.InUse, this.accStates.InUse);
        }

        this.updateInUseQueued = false;

      });

      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateInUseQueued = true;
      };
   };

  }

}
