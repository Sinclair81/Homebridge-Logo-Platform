let ModbusRTU = require('modbus-serial');

import { ReadCoilResult, ReadRegisterResult, WriteCoilResult, WriteRegisterResult } from "./ModbusRTU";
import { ErrorNumber } from "./error";

export enum AddressType {
    MBATDiscreteInput   = 0,
    MBATCoil            = 1,
    MBATInputRegister   = 2,
    MBATHoldingRegister = 3
}

export enum WordLen {
    MBWLBit   = 0,
    MBWLByte  = 1,
    MBWLWord  = 2,
    MBWLDWord = 3
}

export class LogoAddress {
    constructor(
        public addr: number,
        public type: AddressType,
        public wLen: WordLen,
        public readOnly: Boolean
    ) {}
}

export class ModBusLogo {

    public ip:          string;
    public port:        number;
    public debugMsgLog: number;
    public log:         Function;
    public retryCnt:    number;

    constructor(
        ip:          string,
        port:        number,
        debug:       number,
        logFunction: any,
        retrys:      number
    ) {
        this.ip          = ip;
        this.port        = port;
        this.debugMsgLog = debug;
        this.log         = logFunction;
        this.retryCnt    = retrys;
    }

    ReadLogo(item: string, callBack: (value: number) => any) {

        if (!item) {
            if (this.debugMsgLog == 1) {
                this.log('ReadLogo() ModBus - No LOGO! Address!');
            }
            callBack(ErrorNumber.noData);
            return ErrorNumber.noData;
        }

        var addr = this.getLogoAddress(item);

        switch (addr.type) {
            case AddressType.MBATDiscreteInput:
                    this.readDiscreteInput(addr, callBack, this.debugMsgLog, this.log, this.retryCnt);
                break;

            case AddressType.MBATCoil:
                    this.readCoil(addr, callBack, this.debugMsgLog, this.log, this.retryCnt);
                break;

            case AddressType.MBATInputRegister:
                    this.readInputRegister(addr, callBack, this.debugMsgLog, this.log, this.retryCnt);
                break;

            case AddressType.MBATHoldingRegister:
                    this.readHoldingRegister(addr, callBack, this.debugMsgLog, this.log, this.retryCnt);
                break;
        }
    }

    WriteLogo(item: string, value: number) {

        if (!item) {
            if (this.debugMsgLog == 1) {
                this.log('WriteLogo() ModBus - No LOGO! Address!');
            }
            return ErrorNumber.noData;
        }

        var addr = this.getLogoAddress(item);

        if ((addr.readOnly == false) && (value >= 0)) {

            if (addr.type == AddressType.MBATCoil) {

                this.writeCoil(addr.addr, (value == 1 ? true : false), this.debugMsgLog, this.log, this.retryCnt); 

            }

            if (addr.type == AddressType.MBATHoldingRegister) {

                switch (addr.wLen) {
                    case WordLen.MBWLByte:
                            this.writeRegister(addr.addr, ((value & 0b11111111) << 8), this.debugMsgLog, this.log, this.retryCnt);
                        break;

                    case WordLen.MBWLWord:
                            this.writeRegister(addr.addr, value, this.debugMsgLog, this.log, this.retryCnt);
                        break;

                    case WordLen.MBWLDWord:
                            this.writeRegisters(addr.addr, [((value & 0b11111111111111110000000000000000) >> 16), (value & 0b00000000000000001111111111111111)], this.debugMsgLog, this.log, this.retryCnt);
                        break;
                }
            }
            
        }
    }

    DisconnectS7() {
        if (this.debugMsgLog == 1) {
            this.log('DisconnectS7() - ModBus LOGO! has no disconnect.');
        }
    }

    readDiscreteInput(addr: LogoAddress, callBack: (value: number) => any, debugLog: number, log: any, retryCount: number) {
        
        if (retryCount == 0) {
            if (debugLog == 1) {
                log('readDiscreteInput() - Retry counter reached max value');
            }
            callBack(ErrorNumber.noData);
            return ErrorNumber.noData;
        }
        
        let len = 1;
        let client = new ModbusRTU();
        retryCount = retryCount - 1;

        client.connectTcpRTUBuffered(this.ip, { port: this.port }, () => {
            client.setTimeout(100);
            client.setID(1);
            client.readDiscreteInputs(addr.addr, len, (err: Error, data: ReadCoilResult) => {
                if (err) {
                    this.logError(log, err, debugLog, retryCount);
                    
                    sleep(100).then(() => {
                        this.readDiscreteInput(addr, callBack, debugLog, log, retryCount); 
                    });

                } else {
                    callBack((data.data[0] == true ? 1 : 0));
                }
                client.close();
            });
        });
    }

    readCoil(addr: LogoAddress, callBack: (value: number) => any, debugLog: number, log: any, retryCount: number) {
        
        if (retryCount == 0) {
            if (debugLog == 1) {
                log('readCoil() - Retry counter reached max value');
            }
            callBack(ErrorNumber.noData);
            return ErrorNumber.noData;
        }
        
        let len = 1;
        let client = new ModbusRTU();
        retryCount = retryCount - 1;

        client.connectTcpRTUBuffered(this.ip, { port: this.port }, () => {
            client.setTimeout(100);
            client.setID(1);
            client.readCoils(addr.addr, len, (err: Error, data: ReadCoilResult) => {
                if (err) {
                    this.logError(log, err, debugLog, retryCount);
                    
                    sleep(100).then(() => {
                        this.readCoil(addr, callBack, debugLog, log, retryCount); 
                    });

                } else {
                    callBack((data.data[0] == true ? 1 : 0));
                }
                client.close();
            });
        });
    }

    readInputRegister(addr: LogoAddress, callBack: (value: number) => any, debugLog: number, log: any, retryCount: number) {
        
        if (retryCount == 0) {
            if (debugLog == 1) {
                log('readInputRegister() - Retry counter reached max value');
            }
            callBack(ErrorNumber.noData);
            return ErrorNumber.noData;
        }
        
        let len = 1;
        let client = new ModbusRTU();
        retryCount = retryCount - 1;

        client.connectTcpRTUBuffered(this.ip, { port: this.port }, () => {
            client.setTimeout(100);
            client.setID(1);
            client.readInputRegisters(addr.addr, len, (err: Error, data: ReadRegisterResult) => {
                if (err) {
                    this.logError(log, err, debugLog, retryCount);
                    
                    sleep(100).then(() => {
                        this.readInputRegister(addr, callBack, debugLog, log, retryCount); 
                    });

                } else {
                    let num = data.data[0];
                    if (num > ErrorNumber.maxPositivNumber) {
                        num = num - ErrorNumber.max16BitNumber;
                    }
                    callBack(num);
                }
                client.close();
            });
        });
    }

    readHoldingRegister(addr: LogoAddress, callBack: (value: number) => any, debugLog: number, log: any, retryCount: number) {
        
        if (retryCount == 0) {
            if (debugLog == 1) {
                log('readHoldingRegister() - Retry counter reached max value');
            }
            callBack(ErrorNumber.noData);
            return ErrorNumber.noData;
        }
        
        let len = (addr.wLen == WordLen.MBWLDWord ? 2 : 1);
        let client = new ModbusRTU();
        retryCount = retryCount - 1;

        client.connectTcpRTUBuffered(this.ip, { port: this.port }, () => {
            client.setTimeout(100);
            client.setID(1);
            client.readHoldingRegisters(addr.addr, len, (err: Error, data: ReadRegisterResult) => {
                if (err) {
                    this.logError(log, err, debugLog, retryCount);
                    
                    sleep(100).then(() => {
                        this.readHoldingRegister(addr, callBack, debugLog, log, retryCount); 
                    });

                } else {
                    let num = 0;
                    switch (addr.wLen) {

                        case WordLen.MBWLByte:
                            num = (data.data[0] & 0b1111111100000000) >> 8;
                            if (num > ErrorNumber.maxPositivNumber) {
                                num = num - ErrorNumber.max16BitNumber;
                            }
                            callBack(num);
                            break;
    
                        case WordLen.MBWLWord:
                            num = data.data[0];
                            if (num > ErrorNumber.maxPositivNumber) {
                                num = num - ErrorNumber.max16BitNumber;
                            }
                            callBack(num);
                            break;
    
                        case WordLen.MBWLDWord:
                            num = (data.data[0] << 16) | data.data[1];
                            if (num > ErrorNumber.maxPositivNumber) {
                                num = num - ErrorNumber.max16BitNumber;
                            }
                            callBack(num);
                            break;
                    }
                }
                client.close();
            });
        });
    }

    writeCoil(addr: number, state: Boolean, debugLog: number, log: any, retryCount: number) {
        
        if (retryCount == 0) {
            if (debugLog == 1) {
                log('writeCoil() - Retry counter reached max value');
            }
            return ErrorNumber.noData;
        }

        let client = new ModbusRTU();
        retryCount = retryCount - 1;

        client.connectTcpRTUBuffered(this.ip, { port: this.port }, () => {
            client.setTimeout(100);
            client.setID(1);

            client.writeCoil(addr, state, (err: Error, data: WriteCoilResult) => {
                if (err) {
                    this.logError(log, err, debugLog, retryCount);

                    sleep(100).then(() => {
                        this.writeCoil(addr, state, debugLog, log, retryCount); 
                    });

                }
                client.close(); 
            });

        });

    }

    writeRegister(addr: number, value: number, debugLog: number, log: any, retryCount: number) {

        if (retryCount == 0) {
            if (debugLog == 1) {
                log('writeRegister() - Retry counter reached max value');
            }
            return ErrorNumber.noData;
        }

        let client = new ModbusRTU();
        retryCount = retryCount - 1;

        client.connectTcpRTUBuffered(this.ip, { port: this.port }, () => {
            client.setTimeout(100);
            client.setID(1);

            client.writeRegister(addr, value, (err: Error, data: WriteRegisterResult) => {
                if (err) {
                    this.logError(log, err, debugLog, retryCount);

                    sleep(100).then(() => {
                        this.writeRegister(addr, value, debugLog, log, retryCount); 
                    });
                }
                
                client.close();
            });
        });
    }

    writeRegisters(addr: number, value: number[], debugLog: number, log: any, retryCount: number) {

        if (retryCount == 0) {
            if (debugLog == 1) {
                log(' writeRegisters() - Retry counter reached max value');
            }
            return ErrorNumber.noData;
        }

        let client = new ModbusRTU();
        retryCount = retryCount - 1;

        client.connectTcpRTUBuffered(this.ip, { port: this.port }, () => {
            client.setTimeout(100);
            client.setID(1);

            client.writeRegisters(addr, value, (err: Error, data: WriteRegisterResult) => {
                if (err) {
                    this.logError(log, err, debugLog, retryCount);

                    sleep(100).then(() => {
                        this.writeRegisters(addr, value, debugLog, log, retryCount); 
                    });
                }
                
                client.close();
            });
        });
    }

    logError(log: any, err: Error, debugLog: number, retryCount: number) {
        if (err.name.endsWith("PortNotOpenError")) {
            log(err);
        } else {
            if ((debugLog == 1) && (retryCount == 1)) {
                log(err);
            }
        }
    }

    getLogoAddress(name: string): LogoAddress {

        if (name.match("AI[0-9]{1,2}")) {
            var num = parseInt(name.replace("AI", ""), 10)
            return new LogoAddress(num - 1, AddressType.MBATInputRegister, WordLen.MBWLWord, true); // Start: 0, Lenght: 8
        }

        if (name.match("AQ[0-9]{1,2}")) {
            var num = parseInt(name.replace("AQ", ""), 10)
            return new LogoAddress((511 + num), AddressType.MBATHoldingRegister, WordLen.MBWLWord, false); // Start: 512, Lenght: 8
        }

        if (name.match("AM[0-9]{1,2}")) {
            var num = parseInt(name.replace("AM", ""), 10)
            return new LogoAddress((527 + num), AddressType.MBATHoldingRegister, WordLen.MBWLWord, false); // Start: 528, Lenght: 8
        }

        if (name.match("I[0-9]{1,2}")) {
            var num = parseInt(name.replace("I", ""), 10)
            return new LogoAddress(num - 1, AddressType.MBATDiscreteInput, WordLen.MBWLBit, true); // Start: 0, Lenght: 24
        }

        if (name.match("Q[0-9]{1,2}")) {
            var num = parseInt(name.replace("Q", ""), 10)
            return new LogoAddress((8191 + num), AddressType.MBATCoil, WordLen.MBWLBit, false); // Start: 8192, Lenght: 20
        }

        if (name.match("M[0-9]{1,2}")) {
            var num = parseInt(name.replace("M", ""), 10)
            return new LogoAddress((8255 + num), AddressType.MBATCoil, WordLen.MBWLBit, false); // Start: 8256, Lenght: 64
        }

        if (name.match("V[0-9]{1,4}\.[0-7]{1}")) {
            var str = name.replace("V", "");
            var a = parseInt(str.split(".", 2)[0], 10);
            var b = parseInt(str.split(".", 2)[1], 10);
            return new LogoAddress(((a * 8) + b), AddressType.MBATCoil, WordLen.MBWLBit, false); // Start: 0, Lenght: 6808 (850*8+8)
        }

        if (name.match("VB[0-9]{1,4}")) {
            var num = parseInt(name.replace("VB", ""), 10)
            return new LogoAddress(Math.floor(num / 2), AddressType.MBATHoldingRegister, WordLen.MBWLByte, false); // Start: 0, Lenght: 425 (850/2)
        }

        if (name.match("VW[0-9]{1,4}")) {
            var num = parseInt(name.replace("VW", ""), 10)
            return new LogoAddress(Math.floor(num / 2), AddressType.MBATHoldingRegister, WordLen.MBWLWord, false); // Start: 0, Lenght: 425 (850/2)
        }

        if (name.match("VD[0-9]{1,4}")) {
            var num = parseInt(name.replace("VD", ""), 10)
            return new LogoAddress(Math.floor(num / 2), AddressType.MBATHoldingRegister, WordLen.MBWLDWord, false); // Start: 0, Lenght: 425 (850/2)
        }

        return new LogoAddress(0, AddressType.MBATCoil, WordLen.MBWLBit, false);
    }

    isValidLogoAddress(name: string): boolean {

        if (name.match("AI[0-9]{1,2}")) {
            return true;
        }

        if (name.match("AQ[0-9]{1,2}")) {
            return true;
        }

        if (name.match("AM[0-9]{1,2}")) {
            return true;
        }

        if (name.match("I[0-9]{1,2}")) {
            return true;
        }

        if (name.match("Q[0-9]{1,2}")) {
            return true;
        }

        if (name.match("M[0-9]{1,2}")) {
            return true;
        }

        if (name.match("V[0-9]{1,4}\.[0-7]{1}")) {
            return true;
        }

        if (name.match("VB[0-9]{1,4}")) {
            return true;
        }

        if (name.match("VW[0-9]{1,4}")) {
            return true;
        }

        if (name.match("VD[0-9]{1,4}")) {
            return true;
        }

        return false;
    }

    isAnalogLogoAddress(name: string): boolean {

        if (name.match("AI[0-9]{1,2}")) {
            return true;
        }

        if (name.match("AQ[0-9]{1,2}")) {
            return true;
        }

        if (name.match("AM[0-9]{1,2}")) {
            return true;
        }

        if (name.match("I[0-9]{1,2}")) {
            return false;
        }

        if (name.match("Q[0-9]{1,2}")) {
            return false;
        }

        if (name.match("M[0-9]{1,2}")) {
            return false;
        }

        if (name.match("V[0-9]{1,4}\.[0-7]{1}")) {
            return false;
        }

        if (name.match("VB[0-9]{1,4}")) {
            return true;
        }

        if (name.match("VW[0-9]{1,4}")) {
            return true;
        }

        if (name.match("VD[0-9]{1,4}")) {
            return true;
        }

        return false;
    }
}

const sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}