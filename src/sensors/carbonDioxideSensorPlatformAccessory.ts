import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { md5 } from "../md5";
import { UdpClient } from '../udp';

export class CarbonDioxideSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Carbon Dioxide Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;
  private logging: number;
  private updateCarbonDioxideDetectedQueued: boolean;
  private updateCarbonDioxideLevelQueued: boolean;
  private updateCarbonDioxidePeakLevelQueued: boolean;

  private udpClient: UdpClient;

  private sensStates = {
    CarbonDioxideDetected: 0,
    CarbonDioxideLevel: 0,
    CarbonDioxidePeakLevel: 0,
  };

  name: string;

  constructor( api: API, platform: any, device: any ) {

    this.name     = device.name;
    this.api      = api;
    this.platform = platform;
    this.device   = device;
    this.logging  = this.device.logging || 0;

    this.udpClient = new UdpClient(this.platform, this.device);

    this.errorCheck();

    this.service = new this.api.hap.Service.CarbonDioxideSensor(this.device.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.CarbonDioxideDetected)
      .onGet(this.getCarbonDioxideDetected.bind(this));

    if (this.device.carbonDioxideLevel) {
      this.service.getCharacteristic(this.api.hap.Characteristic.CarbonDioxideLevel)
        .onGet(this.getCarbonDioxideLevel.bind(this));
    }
    
    if (this.device.carbonDioxidePeakLevel) {
      this.service.getCharacteristic(this.api.hap.Characteristic.CarbonDioxidePeakLevel)
        .onGet(this.getCarbonDioxidePeakLevel.bind(this));
    }

    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    this.updateCarbonDioxideDetectedQueued = false;
    this.updateCarbonDioxideLevelQueued = false;
    this.updateCarbonDioxidePeakLevelQueued = false;
    
      if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCarbonDioxideDetected();
        this.updateCarbonDioxideLevel();
        this.updateCarbonDioxidePeakLevel();
      }, this.platform.config.updateInterval);

    }
    
  }

  errorCheck() {
    if (!this.device.carbonDioxide) {
      this.platform.log.error('[%s] LOGO! Addresses not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return [ this.information, this.service ];
  }

  async getCarbonDioxideDetected(): Promise<CharacteristicValue> {
    
    const isCarbonDioxideDetected = this.sensStates.CarbonDioxideDetected;
    this.updateCarbonDioxideDetected();

    return isCarbonDioxideDetected;
  }

  async getCarbonDioxideLevel(): Promise<CharacteristicValue> {
    
    const isCarbonDioxideLevel = this.sensStates.CarbonDioxideLevel;
    this.updateCarbonDioxideLevel();

    return isCarbonDioxideLevel;
  }

  async getCarbonDioxidePeakLevel(): Promise<CharacteristicValue> {
    
    const isCarbonDioxidePeakLevel = this.sensStates.CarbonDioxidePeakLevel;
    this.updateCarbonDioxidePeakLevel();

    return isCarbonDioxidePeakLevel;
  }

  updateCarbonDioxideDetected() {

    if (this.updateCarbonDioxideDetectedQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.carbonDioxide, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.sensStates.CarbonDioxideDetected = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CarbonDioxideDetected -> %i', this.device.name, this.sensStates.CarbonDioxideDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CarbonDioxideDetected, this.sensStates.CarbonDioxideDetected);

        if (this.logging) {
          this.udpClient.sendMessage("CarbonDioxideDetected", String(this.sensStates.CarbonDioxideDetected));
        }
      }

      this.updateCarbonDioxideDetectedQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCarbonDioxideDetectedQueued = true;
    };

  }

  updateCarbonDioxideLevel() {

    if (this.device.carbonDioxideLevel) {

      if (this.updateCarbonDioxideLevelQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.carbonDioxideLevel, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.sensStates.CarbonDioxideLevel = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get CarbonDioxideLevel -> %f', this.device.name, this.sensStates.CarbonDioxideLevel);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.CarbonDioxideLevel, this.sensStates.CarbonDioxideLevel);

          if (this.logging) {
            this.udpClient.sendMessage("CarbonDioxideLevel", String(this.sensStates.CarbonDioxideLevel));
          }
        }

        this.updateCarbonDioxideLevelQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateCarbonDioxideLevelQueued = true;
      };

    }

  }

  updateCarbonDioxidePeakLevel() {

    if (this.device.carbonDioxidePeakLevel) {

      if (this.updateCarbonDioxidePeakLevelQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.carbonDioxidePeakLevel, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.sensStates.CarbonDioxidePeakLevel = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get CarbonDioxidePeakLevel -> %f', this.device.name, this.sensStates.CarbonDioxidePeakLevel);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.CarbonDioxidePeakLevel, this.sensStates.CarbonDioxidePeakLevel);

          if (this.logging) {
            this.udpClient.sendMessage("CarbonDioxidePeakLevel", String(this.sensStates.CarbonDioxidePeakLevel));
          }
        }

        this.updateCarbonDioxidePeakLevelQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateCarbonDioxidePeakLevelQueued = true;
      };

    }

  }

}
