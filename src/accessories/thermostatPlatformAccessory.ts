import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";

export class ThermostatPlatformAccessory implements AccessoryPlugin {

  private model: string = "Thermostat";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private pushButton: number;
  private updateCurrentHeatingCoolingStateQueued: boolean;
  private updateTargetHeatingCoolingStateQueued: boolean;
  private updateCurrentTemperatureQueued: boolean;
  private updateTargetTemperatureQueued: boolean;

  private accStates = {
    CurrentHeatingCoolingState: 0,
    TargetHeatingCoolingState: 0,
    CurrentTemperature: 0,
    TargetTemperature: 10,
    TemperatureDisplayUnits: 0,
    MinTemperature: -270,
    MaxTemperature: 100,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = (this.device.pushButton ? 1 : 0) || this.platform.pushButton;

    this.errorCheck();

    this.service = new this.api.hap.Service.Thermostat(this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onSet(this.setTargetHeatingCoolingState.bind(this))
      .onGet(this.getTargetHeatingCoolingState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onSet(this.setTargetTemperature.bind(this))
      .onGet(this.getTargetTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet(this.getTemperatureDisplayUnits.bind(this));

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

      this.updateCurrentHeatingCoolingStateQueued = false;
      this.updateTargetHeatingCoolingStateQueued = false;
      this.updateCurrentTemperatureQueued = false;
      this.updateTargetTemperatureQueued = false;

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentHeatingCoolingState();
        this.updateTargetHeatingCoolingState();
        this.updateCurrentTemperature();
        this.updateTargetTemperature();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.thermostatGetHCState || !this.device.thermostatGetTargetHCState || !this.device.thermostatSetTargetHCState || 
      !this.device.thermostatGetTemp || !this.device.thermostatGetTargetTemp || !this.device.thermostatSetTargetTemp) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async setTargetHeatingCoolingState(value: CharacteristicValue) {
    
    this.accStates.TargetHeatingCoolingState = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set TargetHeatingCoolingState <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.thermostatSetTargetHCState, this.accStates.TargetHeatingCoolingState, 0);
    this.platform.queue.bequeue(qItem);

  }

  async setTargetTemperature(value: CharacteristicValue) {
    
    this.accStates.TargetTemperature = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set TargetTemperature <- %i', this.device.name, value);
    }

    let newValue: number;
    if (this.device.thermostatConvertValue) {
      newValue = (this.accStates.TargetTemperature * 10)
    } else {
      newValue = this.accStates.TargetTemperature
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.thermostatSetTargetTemp, newValue, 0);
    this.platform.queue.bequeue(qItem);

  }

  async getCurrentHeatingCoolingState(): Promise<CharacteristicValue> {
    
    const isCurrentHeatingCoolingState = this.accStates.CurrentHeatingCoolingState;
    this.updateCurrentHeatingCoolingState();

    return isCurrentHeatingCoolingState;
  }

  async getTargetHeatingCoolingState(): Promise<CharacteristicValue> {
    
    const isTargetHeatingCoolingState = this.accStates.TargetHeatingCoolingState;
    this.updateTargetHeatingCoolingState();

    return isTargetHeatingCoolingState;
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    
    const isCurrentTemperature = this.accStates.CurrentTemperature;
    this.updateCurrentTemperature();

    return isCurrentTemperature;
  }

  async getTargetTemperature(): Promise<CharacteristicValue> {
    
    const isTargetTemperature = this.accStates.TargetTemperature;
    this.updateTargetTemperature();

    return isTargetTemperature;
  }

  async getTemperatureDisplayUnits(): Promise<CharacteristicValue> {
    
    const isTemperatureDisplayUnits = this.accStates.TemperatureDisplayUnits;

    return isTemperatureDisplayUnits;
  }

  updateCurrentHeatingCoolingState() {

    if (this.updateCurrentHeatingCoolingStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.thermostatGetHCState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentHeatingCoolingState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentHeatingCoolingState -> %i', this.device.name, this.accStates.CurrentHeatingCoolingState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentHeatingCoolingState, this.accStates.CurrentHeatingCoolingState);
      }

      this.updateCurrentHeatingCoolingStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentHeatingCoolingStateQueued = true;
    };

  }

  updateTargetHeatingCoolingState() {

    if (this.updateTargetHeatingCoolingStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.thermostatGetTargetHCState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.TargetHeatingCoolingState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get TargetHeatingCoolingState -> %i', this.device.name, this.accStates.TargetHeatingCoolingState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetHeatingCoolingState, this.accStates.TargetHeatingCoolingState);
      }

      this.updateTargetHeatingCoolingStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetHeatingCoolingStateQueued = true;
    };

  }

  updateCurrentTemperature() {

    if (this.updateCurrentTemperatureQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.thermostatGetTemp, async (value: number) => {

      if (value != ErrorNumber.noData) {

        if (this.device.thermostatConvertValue) {
          this.accStates.CurrentTemperature = (value as number / 10);
        } else {
          this.accStates.CurrentTemperature = value as number;
        }
        if (this.accStates.CurrentTemperature < this.accStates.MinTemperature) {
          this.accStates.CurrentTemperature = this.accStates.MinTemperature;
        }
        if (this.accStates.CurrentTemperature > this.accStates.MaxTemperature) {
          this.accStates.CurrentTemperature = this.accStates.MaxTemperature;
        }

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentTemperature -> %i', this.device.name, this.accStates.CurrentTemperature);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentTemperature, this.accStates.CurrentTemperature);
      }

      this.updateCurrentTemperatureQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentTemperatureQueued = true;
    };

  }

  updateTargetTemperature() {

    if (this.updateTargetTemperatureQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.thermostatGetTargetTemp, async (value: number) => {

      if (value != ErrorNumber.noData) {

        if (this.device.thermostatConvertValue) {
          this.accStates.TargetTemperature = (value as number / 10);
        } else {
          this.accStates.TargetTemperature = value as number;
        }

        if (this.accStates.TargetTemperature < 10) {
          this.accStates.TargetTemperature = 10;
        }
        if (this.accStates.TargetTemperature > 38) {
          this.accStates.TargetTemperature = 38;
        }

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get TargetTemperature -> %i', this.device.name, this.accStates.TargetTemperature);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetTemperature, this.accStates.TargetTemperature);
      }

      this.updateTargetTemperatureQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetTemperatureQueued = true;
    };

  }

}
