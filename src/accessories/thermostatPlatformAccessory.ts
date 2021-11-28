import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class ThermostatPlatformAccessory implements AccessoryPlugin {

  private model: string = "Thermostat";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

  private accStates = {
    CurrentHeatingCoolingState: 0,
    TargetHeatingCoolingState: 0,
    CurrentTemperature: 0,
    TargetTemperature: 10,
    TemperatureDisplayUnits: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;

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

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCurrentHeatingCoolingState();
        this.updateTargetHeatingCoolingState();
        this.updateCurrentTemperature();
        this.updateTargetTemperature();
      }, this.platform.config.updateInterval);

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

    let qItem: QueueItem = new QueueItem(this.device.thermostatSetTargetHCState, true, this.accStates.TargetHeatingCoolingState);
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

    let qItem: QueueItem = new QueueItem(this.device.thermostatSetTargetTemp, true, newValue);
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
    
    let qItem: QueueItem = new QueueItem(this.device.thermostatGetHCState, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.CurrentHeatingCoolingState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentHeatingCoolingState -> %i', this.device.name, this.accStates.CurrentHeatingCoolingState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentHeatingCoolingState, this.accStates.CurrentHeatingCoolingState);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateTargetHeatingCoolingState() {
    
    let qItem: QueueItem = new QueueItem(this.device.thermostatGetTargetHCState, false, 0, async (value: number) => {

      if (value != -1) {

        this.accStates.TargetHeatingCoolingState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get TargetHeatingCoolingState -> %i', this.device.name, this.accStates.TargetHeatingCoolingState);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetHeatingCoolingState, this.accStates.TargetHeatingCoolingState);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateCurrentTemperature() {
    
    let qItem: QueueItem = new QueueItem(this.device.thermostatGetTemp, false, 0, async (value: number) => {

      if (value != -1) {

        if (this.device.thermostatConvertValue) {
          this.accStates.CurrentTemperature = (value as number / 10);
        } else {
          this.accStates.CurrentTemperature = value as number;
        }

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CurrentTemperature -> %i', this.device.name, this.accStates.CurrentTemperature);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentTemperature, this.accStates.CurrentTemperature);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateTargetTemperature() {
    
    let qItem: QueueItem = new QueueItem(this.device.thermostatGetTargetTemp, false, 0, async (value: number) => {

      if (value != -1) {

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

    });

    this.platform.queue.enqueue(qItem);

  }

}
