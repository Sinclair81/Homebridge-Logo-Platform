import { AccessoryPlugin, API, Service, CharacteristicValue } from 'homebridge';

import { QueueSendItem, QueueReceiveItem } from "../queue";
import { ErrorNumber } from "../error";
import { LoggerType, InfluxDBLogItem, InfluxDBFild } from "../logger";
import { md5 } from "../md5";
import { Accessory, SubAccessory } from '../logo';

import { SwitchPlatformAccessory }            from './switchPlatformAccessory';
import { LightbulbPlatformAccessory }         from './lightbulbPlatformAccessory';
import { BlindPlatformAccessory }             from './blindPlatformAccessory';
import { WindowPlatformAccessory }            from './windowPlatformAccessory';
import { GaragedoorPlatformAccessory }        from './garagedoorPlatformAccessory';
import { ThermostatPlatformAccessory }        from './thermostatPlatformAccessory';
import { FilterMaintenancePlatformAccessory } from './filterMaintenancePlatformAccessory';
import { OutletPlatformAccessory }            from './outletPlatformAccessory';

import { LightSensorPlatformAccessory }         from '../sensors/lightSensorPlatformAccessory';
import { MotionSensorPlatformAccessory }        from '../sensors/motionSensorPlatformAccessory';
import { ContactSensorPlatformAccessory }       from '../sensors/contactSensorPlatformAccessory';
import { SmokeSensorPlatformAccessory }         from '../sensors/smokeSensorPlatformAccessory';
import { TemperatureSensorPlatformAccessory }   from '../sensors/temperatureSensorPlatformAccessory';
import { HumiditySensorPlatformAccessory }      from '../sensors/humiditySensorPlatformAccessory';
import { CarbonDioxideSensorPlatformAccessory } from '../sensors/carbonDioxideSensorPlatformAccessory';
import { AirQualitySensorPlatformAccessory }    from '../sensors/airQualitySensorPlatformAccessory';
import { LeakSensorPlatformAccessory }          from '../sensors/leakSensorPlatformAccessory';

export class FanPlatformAccessory implements AccessoryPlugin {

  private model: string = "Fan";

  private api: API;
  private service: Service;
  private information: Service;

  private subs: any[];
  public services: Service[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateOnQueued: boolean;
  private updateRotationDirectionQueued: boolean;
  private updateRotationSpeedQueued: boolean;

  private accStates = {
    On: false,
    RotationDirection: 0, // CW = 0 / CCW = 1
    RotationSpeed: 0,
  };

  name: string;
  isParentAccessory: boolean;

  constructor( api: API, platform: any, device: any, parent?: any ) {

    this.name       = device.name;
    this.api        = api;
    this.platform   = platform;
    this.device     = device;
    this.pushButton = this.device.pushButton || this.platform.pushButton;
    this.logging    = this.device.logging    || 0;

    this.subs = [];
    this.services = [];

    this.isParentAccessory = false;

    this.errorCheck();

    this.service = new this.api.hap.Service.Fan(this.device.name);

    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
    
    if (this.device.fanGetRotationDirection && this.device.fanSetRotationDirectionCW && this.device.fanSetRotationDirectionCCW) {
      this.service.getCharacteristic(this.platform.Characteristic.RotationDirection)
        .onSet(this.setRotationDirection.bind(this))
        .onGet(this.getRotationDirection.bind(this));
    }

    if (this.device.fanGetRotationSpeed && this.device.fanSetRotationSpeed) {
      this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .onSet(this.setRotationSpeed.bind(this))
        .onGet(this.getRotationSpeed.bind(this));
    }
    
    this.information = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer,     this.platform.manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model,            this.model + ' @ ' + this.platform.model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber,     md5(this.device.name + this.model))
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.platform.firmwareRevision);

    const configDevices = this.platform.config.devices;
    for (const dev of configDevices) {

      if (dev.parentAccessory == this.name) {
        this.isParentAccessory = true;

        switch (dev.type) {
          case Accessory.Switch:
            this.subs.push( new SwitchPlatformAccessory(api, platform, dev, this) );
            break;
        
          case Accessory.Lightbulb:
              this.subs.push( new LightbulbPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Blind:
              this.subs.push( new BlindPlatformAccessory(api, platform, dev, this) );
          
          case Accessory.Window:
              this.subs.push( new WindowPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Garagedoor:
              this.subs.push( new GaragedoorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Thermostat:
              this.subs.push( new ThermostatPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Fan:
              this.subs.push( new FanPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.FilterMaintenance:
              this.subs.push( new FilterMaintenancePlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.Outlet:
              this.subs.push( new OutletPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.LightSensor:
              this.subs.push( new LightSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.MotionSensor:
              this.subs.push( new MotionSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.ContactSensor:
              this.subs.push( new ContactSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.SmokeSensor:
              this.subs.push( new SmokeSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.TemperatureSensor:
              this.subs.push( new TemperatureSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.HumiditySensor:
              this.subs.push( new HumiditySensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.CarbonDioxideSensor:
              this.subs.push( new CarbonDioxideSensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.AirQualitySensor:
              this.subs.push( new AirQualitySensorPlatformAccessory(api, platform, dev, this) );
            break;

          case Accessory.LeakSensor:
              this.subs.push( new LeakSensorPlatformAccessory(api, platform, dev, this) );
            break;
        }
      }
    }

    if (this.isParentAccessory == true) {
      this.service.subtype = 'main-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.services.push(this.service, this.information);

    if (parent) {
      parent.service.addLinkedService(this.service);
      parent.services.push(this.service);
    }
    
    this.updateOnQueued = false;
    this.updateRotationDirectionQueued = false;
    this.updateRotationSpeedQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        this.updateOn();
        this.updateRotationDirection();
        this.updateRotationSpeed();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.fanGet || !this.device.fanSetOn || !this.device.fanSetOff) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async setOn(value: CharacteristicValue) {
    
    this.accStates.On = value as boolean;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set On <- %s', this.device.name, value);
    }

    let qItem: QueueSendItem;
    if (value) {
      qItem = new QueueSendItem(this.device.fanSetOn, value as number, this.pushButton);
    } else {
      qItem = new QueueSendItem(this.device.fanSetOff, value as number, this.pushButton);
    }
    this.platform.queue.bequeue(qItem);

  }

  async setRotationDirection(value: CharacteristicValue) {

    if (this.device.fanSetRotationDirectionCW && this.device.fanSetRotationDirectionCCW) {

      this.accStates.RotationDirection = value as number;

      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] Set RotationDirection <- %i', this.device.name, value);
      }

      let qItem: QueueSendItem;
      if (value) {
        qItem = new QueueSendItem(this.device.fanSetRotationDirectionCW, value as number, this.pushButton);
      } else {
        qItem = new QueueSendItem(this.device.fanSetRotationDirectionCCW, value as number, this.pushButton);
      }
      this.platform.queue.bequeue(qItem);
      
    }

  }

  async setRotationSpeed(value: CharacteristicValue) {

    if (this.device.fanSetRotationSpeed) {

      this.accStates.RotationSpeed = value as number;

      if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
        this.platform.log.info('[%s] Set RotationSpeed <- %i', this.device.name, value);
      }

      let qItem: QueueSendItem = new QueueSendItem(this.device.fanSetRotationSpeed, this.accStates.RotationSpeed, 0);
      this.platform.queue.bequeue(qItem);
      
    }

  }

  async getOn(): Promise<CharacteristicValue> {
    
    const isOn = this.accStates.On;
    this.updateOn();

    return isOn;
  }

  async getRotationDirection(): Promise<CharacteristicValue> {
    
    const isRotationDirection = this.accStates.RotationDirection;
    this.updateRotationDirection();

    return isRotationDirection;
  }

  async getRotationSpeed(): Promise<CharacteristicValue> {
    
    const isRotationSpeed = this.accStates.RotationSpeed;
    this.updateRotationSpeed();

    return isRotationSpeed;
  }

  updateOn() {

    if (this.updateOnQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.fanGet, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.On = (value == 1 ? true : false);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get On -> %s', this.device.name, this.accStates.On);
        }

        this.service.updateCharacteristic(this.api.hap.Characteristic.On, this.accStates.On);
      }

      this.updateOnQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateOnQueued = true;
    };
  
  }

  updateRotationDirection() {

    if (this.device.fanGetRotationDirection) {

      if (this.updateRotationDirectionQueued) {return;}

      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.fanGetRotationDirection, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.accStates.RotationDirection = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RotationDirection -> %i', this.device.name, this.accStates.RotationDirection);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.RotationDirection, this.accStates.RotationDirection);
        }

        this.updateRotationDirectionQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateRotationDirectionQueued = true;
      };
      
    }

  }

  updateRotationSpeed() {
    
    if (this.device.fanGetRotationSpeed) {

      if (this.updateRotationSpeedQueued) {return;}
      
      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.fanGetRotationSpeed, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.accStates.RotationSpeed = value as number;
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get RotationSpeed -> %i', this.device.name, this.accStates.RotationSpeed);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.RotationSpeed, this.accStates.RotationSpeed);
        }

        this.updateRotationSpeedQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateRotationSpeedQueued = true;
      };

    }

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("On",                this.accStates.On,                InfluxDBFild.Bool));
      logItems.push(new InfluxDBLogItem("RotationDirection", this.accStates.RotationDirection, InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("RotationSpeed",     this.accStates.RotationSpeed,     InfluxDBFild.Int));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }

  }

}
