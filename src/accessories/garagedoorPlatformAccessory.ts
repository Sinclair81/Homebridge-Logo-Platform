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
import { ThermostatPlatformAccessory }        from './thermostatPlatformAccessory';
import { FanPlatformAccessory }               from './fanPlatformAccessory';
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
import { WatchdogPlatformAccessory }            from '../sensors/watchdogPlatformAccessory';

export class GaragedoorPlatformAccessory implements AccessoryPlugin {

  private model: string = "Garagedoor";

  private api: API;
  private service: Service;
  private information: Service;

  private subs: any[];
  public services: Service[];

  private platform: any;
  private device: any;
  private pushButton: number;
  private logging: number;
  private updateCurrentDoorStateAndTargetDoorStateQueued: boolean;
  private updateCurrentDoorStateQueued: boolean;
  private updateTargetDoorStateQueued: boolean;
  private updateObstructionDetectedQueued: boolean;

  private currentDoorStateIsTargetDoorStateInLogo: number;

  private accStates = {
    CurrentDoorState: 1,
    TargetDoorState: 1,
    ObstructionDetected: false,
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
    this.currentDoorStateIsTargetDoorStateInLogo = this.checkDoorState();

    this.service = new this.api.hap.Service.GarageDoorOpener(this.device.name);

    if (parent) {
      this.service.subtype = 'sub-' + this.model + "-" + this.name.replace(" ", "-");
    }

    this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .onGet(this.getCurrentDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .onSet(this.setTargetDoorState.bind(this))
      .onGet(this.getTargetDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.getObstructionDetected.bind(this));

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
            break;
          
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

          case Accessory.Watchdog:
            this.subs.push( new WatchdogPlatformAccessory(api, platform, dev, this) );
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
      
    this.updateCurrentDoorStateAndTargetDoorStateQueued = false;
    this.updateCurrentDoorStateQueued = false;
    this.updateTargetDoorStateQueued = false;
    this.updateObstructionDetectedQueued = false;

    if (this.platform.config.updateInterval) {
      setInterval(() => {
        if (this.currentDoorStateIsTargetDoorStateInLogo == 1) {
          this.updateCurrentDoorStateAndTargetDoorState();
        } else {
          this.updateCurrentDoorState();
          this.updateTargetDoorState();
        }
        this.updateObstructionDetected();
      }, this.platform.config.updateInterval);
    }

    if (this.logging) {
      setInterval(() => {
        this.logAccessory();
      }, this.platform.loggerInterval);
    }

    
  }

  errorCheck() {
    if (!this.device.garagedoorGetState || !this.device.garagedoorGetTargetState || !this.device.garagedoorSetTargetState) {
      this.platform.log.error('[%s] One or more LOGO! Addresses are not correct!', this.device.name);
    }
  }
  checkDoorState(): number {
    if (this.device.garagedoorGetState == this.device.garagedoorGetTargetState) {
      return 1;
    } else {
      return 0;
    }
  }

  getServices(): Service[] {
    return this.services;
  }

  async setTargetDoorState(value: CharacteristicValue) {
    
    this.accStates.TargetDoorState = value as number;

    if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
      this.platform.log.info('[%s] Set TargetDoorState <- %i', this.device.name, value);
    }

    let qItem: QueueSendItem = new QueueSendItem(this.device.garagedoorSetTargetState, this.accStates.TargetDoorState, 0);
    this.platform.queue.bequeue(qItem);

  }

  async getCurrentDoorState(): Promise<CharacteristicValue> {
    
    const isCurrentDoorState = this.accStates.CurrentDoorState;
    this.updateCurrentDoorState();

    return isCurrentDoorState;
  }

  async getTargetDoorState(): Promise<CharacteristicValue> {
    
    const isTargetDoorState = this.accStates.TargetDoorState;
    this.updateTargetDoorState();

    return isTargetDoorState;
  }

  async getObstructionDetected(): Promise<CharacteristicValue> {
    
    const isObstructionDetected = this.accStates.ObstructionDetected;
    this.updateObstructionDetected();

    return isObstructionDetected;
  }

  updateCurrentDoorState() {
    if (this.platform.isAnalogLogoAddress(this.device.garagedoorGetState)) {
      this.updateAnalogCurrentDoorState();
    } else {
      this.updateDigitalCurrentDoorState();
    }
  }

  updateTargetDoorState() {
    if (this.platform.isAnalogLogoAddress(this.device.garagedoorGetTargetState)) {
      this.updateAnalogTargetDoorState();
    } else {
      this.updateDigitalTargetDoorState();
    }
  }

  updateCurrentDoorStateAndTargetDoorState() {
    if (this.platform.isAnalogLogoAddress(this.device.garagedoorGetState)) {
      this.updateAnalogCurrentDoorStateAndTargetDoorState();
    } else {
      this.updateDigitalCurrentDoorStateAndTargetDoorState();
    }
  }

  updateObstructionDetected() {

    if (this.device.garagedoorObstruction) {

      if (this.updateObstructionDetectedQueued) {return;}

      let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorObstruction, async (value: number) => {

        if (value != ErrorNumber.noData) {
  
          this.accStates.ObstructionDetected = (value == 1 ? true : false);
  
          if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
            this.platform.log.info('[%s] Get ObstructionDetected -> %s', this.device.name, this.accStates.ObstructionDetected);
          }
  
          this.service.updateCharacteristic(this.api.hap.Characteristic.ObstructionDetected, this.accStates.ObstructionDetected);
        }

        this.updateObstructionDetectedQueued = false;
  
      });
  
      if (this.platform.queue.enqueue(qItem) === 1) {
        this.updateObstructionDetectedQueued = true;
      };
      
    }
    
  }

  updateAnalogCurrentDoorState() {
    
    if (this.updateCurrentDoorStateQueued) {return;}

    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Analog CurrentDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }
        // HomeKit - 0 = open; 1 = closed; 2 = opening; 3 = closing; 4 = stoppt
        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
      }

      this.updateCurrentDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateQueued = true;
    };

  }

  updateAnalogTargetDoorState() {

    if (this.updateTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetTargetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.TargetDoorState = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Analog TargetDoorState -> %i', this.device.name, this.accStates.TargetDoorState);
        }
        // HomeKit - 0 = open; 1 = closed;
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetDoorStateQueued = true;
    };

  }

  updateAnalogCurrentDoorStateAndTargetDoorState() {

    if (this.updateCurrentDoorStateAndTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {

      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = value as number;
        this.accStates.TargetDoorState  = value as number;

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Analog CurrentDoorState and TargetDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }
        // HomeKit - 0 = open; 1 = closed; 2 = opening; 3 = closing; 4 = stoppt
        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
        // HomeKit - 0 = open; 1 = closed;
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateCurrentDoorStateAndTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateAndTargetDoorStateQueued = true;
    };

  }

  updateDigitalCurrentDoorState() {

    if (this.updateCurrentDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {
      // Logo return 1 for open !!
      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = (value as number == 1 ? 0 : 1);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Digital CurrentDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }
        // HomeKit - 0 = open; 1 = closed; 2 = opening; 3 = closing; 4 = stoppt
        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
      }

      this.updateCurrentDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateQueued = true;
    };

  }

  updateDigitalTargetDoorState() {

    if (this.updateTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetTargetState, async (value: number) => {
      // Logo return 1 for open !!
      if (value != ErrorNumber.noData) {

        this.accStates.TargetDoorState = (value as number == 1 ? 0 : 1);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Digital TargetDoorState -> %i', this.device.name, this.accStates.TargetDoorState);
        }
        // HomeKit - 0 = open; 1 = closed;
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateTargetDoorStateQueued = true;
    };

  }

  updateDigitalCurrentDoorStateAndTargetDoorState() {

    if (this.updateCurrentDoorStateAndTargetDoorStateQueued) {return;}
    
    let qItem: QueueReceiveItem = new QueueReceiveItem(this.device.garagedoorGetState, async (value: number) => {
      // Logo return 1 for open !!
      if (value != ErrorNumber.noData) {

        this.accStates.CurrentDoorState = (value as number == 1 ? 0 : 1);
        this.accStates.TargetDoorState  = (value as number == 1 ? 0 : 1);

        if (this.platform.config.debugMsgLog || this.device.debugMsgLog) {
          this.platform.log.info('[%s] Get Digital CurrentDoorState and TargetDoorState -> %i', this.device.name, this.accStates.CurrentDoorState);
        }
        // HomeKit - 0 = open; 1 = closed; 2 = opening; 3 = closing; 4 = stoppt
        this.service.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.accStates.CurrentDoorState);
        // HomeKit - 0 = open; 1 = closed;
        this.service.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.accStates.TargetDoorState);
      }

      this.updateCurrentDoorStateAndTargetDoorStateQueued = false;

    });

    if (this.platform.queue.enqueue(qItem) === 1) {
      this.updateCurrentDoorStateAndTargetDoorStateQueued = true;
    };

  }

  logAccessory() {

    if ((this.platform.loggerType == LoggerType.InfluxDB) && this.platform.influxDB.isConfigured) {

      let logItems: InfluxDBLogItem[] = [];
      logItems.push(new InfluxDBLogItem("CurrentDoorState", this.accStates.CurrentDoorState, InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("TargetDoorState",   this.accStates.TargetDoorState,   InfluxDBFild.Int));
      logItems.push(new InfluxDBLogItem("ObstructionDetected",  this.accStates.ObstructionDetected,  InfluxDBFild.Bool));
      this.platform.influxDB.logMultipleValues(this.device.name, logItems);
      
    }

    if (this.platform.loggerType == LoggerType.Fakegato) {

      // this.fakegatoService.addEntry({time: Math.round(new Date().valueOf() / 1000), temp: this.sensStates.CurrentTemperature});

    }

  }

}
