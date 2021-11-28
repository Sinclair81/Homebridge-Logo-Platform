import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueItem } from "../queue";
import { md5 } from "../md5";

export class CarbonDioxideSensorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Carbon Dioxide Sensor";

  private api: API;
  private service: Service;
  private information: Service;

  private platform: any;
  private device: any;

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

    if (this.platform.config.updateInterval) {
      
      setInterval(() => {
        this.updateCarbonDioxideDetected();
        this.updateCarbonDioxideLevel();
        this.updateCarbonDioxidePeakLevel();
      }, this.platform.config.updateInterval);

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
    
    let qItem: QueueItem = new QueueItem(this.device.carbonDioxide, false, 0, async (value: number) => {

      if (value != -1) {

        this.sensStates.CarbonDioxideDetected = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get CarbonDioxideDetected -> %i', this.device.name, this.sensStates.CarbonDioxideDetected);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.CarbonDioxideDetected, this.sensStates.CarbonDioxideDetected);
      }

    });

    this.platform.queue.enqueue(qItem);

  }

  updateCarbonDioxideLevel() {

    if (this.device.carbonDioxideLevel) {
      
      let qItem: QueueItem = new QueueItem(this.device.carbonDioxideLevel, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.sensStates.CarbonDioxideLevel = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get CarbonDioxideLevel -> %i', this.device.name, this.sensStates.CarbonDioxideLevel);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.CarbonDioxideLevel, this.sensStates.CarbonDioxideLevel);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);

    }

  }

  updateCarbonDioxidePeakLevel() {

    if (this.device.carbonDioxidePeakLevel) {
      
      let qItem: QueueItem = new QueueItem(this.device.carbonDioxidePeakLevel, false, 0, async (value: number) => {

        if (value != -1) {
  
          this.sensStates.CarbonDioxidePeakLevel = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get CarbonDioxidePeakLevel -> %i', this.device.name, this.sensStates.CarbonDioxidePeakLevel);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.CarbonDioxidePeakLevel, this.sensStates.CarbonDioxidePeakLevel);
        }
  
      });
  
      this.platform.queue.enqueue(qItem);

    }

  }

}
