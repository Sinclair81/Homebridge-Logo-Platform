let snap7 = require('napi-snap7');

import { ErrorNumber } from "./error";

export enum Area {
    S7AreaPE = 0x81,
    S7AreaPA = 0x82,
    S7AreaMK = 0x83,
    S7AreaDB = 0x84,
    S7AreaCT = 0x1C,
    S7AreaTM = 0x1D
}

export enum WordLen {
    S7WLBit = 0x01,
    S7WLByte = 0x02,
    S7WLChar = 0x03,
    S7WLWord = 0x04,
    S7WLInt = 0x05,
    S7WLDWord = 0x06,
    S7WLDInt = 0x07,
    S7WLReal = 0x08,
    S7WLCounter = 0x1C,
    S7WLTimer = 0x1D
}

export class LogoAddress {
    constructor(
        public addr: number,
        public bit:  number,
        public wLen: number,
        public wLenR: number
    ) {}
}

export class Snap7Logo {

    public type:        string    = "0BA7";
    public ipAddr:      string    = "";
    public local_TSAP:  number    = 0x2000;
    public remote_TSAP: number    = 0x2000;
    public db:          number    = 1;
    public debugMsgLog: number    = 0;
    public log:         Function;
    public retryCnt:    number;

    public s7client: any;

    constructor(
        type:        string,
        ipAddr:      string,
        local_TSAP:  number,
        remote_TSAP: number,
        debug:       number,
        logFunction: any,
        retrys:      number
    ) {
        this.type        = type;
        this.ipAddr      = ipAddr;
        this.local_TSAP  = local_TSAP;
        this.remote_TSAP = remote_TSAP;
        this.debugMsgLog = debug;
        this.log         = logFunction;
        this.retryCnt    = retrys;

        this.s7client  = new snap7.S7Client();
        this.s7client.SetConnectionParams(this.ipAddr, this.local_TSAP, this.remote_TSAP);
    }

    ReadLogo(item: string, callBack: (value: number) => any) {
        this.ConnectS7(this.s7client, this.debugMsgLog, this.retryCnt, (success: Boolean) => {
            if(success == false) {
                if (this.debugMsgLog == 1) {
                    this.log('ReadLogo() - Connection failed.');
                }
                callBack(ErrorNumber.noData);
                return ErrorNumber.noData;
            }

            var target = this.getAddressAndBit(item, this.type);
            
            this.ReadS7(this.s7client, this.db, target, this.debugMsgLog, this.retryCnt, (success: number) => {
                if (success == ErrorNumber.noData) {
                    callBack(ErrorNumber.noData);
                } else {
                    if (success > ErrorNumber.maxPositivNumber) {
                        success = success - ErrorNumber.max16BitNumber;
                    }
                    callBack(success);
                }
            });
        });
    }

    WriteLogo(item: string, value: number) {
        this.ConnectS7(this.s7client, this.debugMsgLog, this.retryCnt, (success: Boolean) => {
            if(success == false) {
                if (this.debugMsgLog == 1) {
                    this.log('WriteLogo() - Connection failed.');
                }
                return ErrorNumber.noData;
            }

            var target = this.getAddressAndBit(item, this.type);
            var buffer_on;

            if (target.wLen == WordLen.S7WLBit) {
                buffer_on = Buffer.from([value << target.bit]);
                // buffer_on = Buffer.from([0b11110000]);
            }

            if (target.wLen == WordLen.S7WLByte) {
                buffer_on  = Buffer.from([value]);
            }

            if (target.wLen == WordLen.S7WLWord) {
                buffer_on  = Buffer.from([((value & 0b1111111100000000) >> 8), (value & 0b0000000011111111)]);
            }
            if (target.wLen == WordLen.S7WLDWord) {
                buffer_on  = Buffer.from([((value & 0b11111111000000000000000000000000) >> 24), ((value & 0b00000000111111110000000000000000) >> 16), ((value & 0b00000000000000001111111100000000) >> 8), (value & 0b00000000000000000000000011111111)]);
            }
            
            this.WriteS7(this.s7client, this.db, target, this.debugMsgLog, this.retryCnt, buffer_on, (success: Boolean) => {
                if(!success) {
                    return ErrorNumber.noData;
                }
            });

        });
    }

    ConnectS7(s7client: any, debugLog: number, retryCount: number, callBack?: (success: Boolean) => any) {
        if (retryCount == 0) {
            if (debugLog == 1) {
                this.log('ConnectS7() - Retry counter reached max value');
            }
            if (callBack) {
                callBack(false);
            }
            return false;
        }
        if (s7client.GetConnected() != true) {
            s7client.Disconnect();
            retryCount = retryCount - 1;
            let err = s7client.Connect();
            if(err == ErrorNumber.noConnection) {
                if ((debugLog == 1) && (retryCount == 1)) {
                    this.log('ConnectS7() - Connection failed. Retrying. Code #' + err + ' - ' + s7client.ErrorText(err));
                }
                if ((debugLog == 1) && (retryCount > 1)) {
                    this.log('ConnectS7() - Connection failed. Retrying. (%i)', retryCount);
                }
                s7client.Disconnect();
                sleep(100).then(() => {
                    this.ConnectS7(s7client, debugLog, retryCount, callBack);
                });
            } else {
                if (callBack) {
                    callBack(true);
                }
            }
        } else {
            if (callBack) {
                callBack(true);
            }
        }
        return true;
    }

    ReadS7(s7client: any, db: number, target: LogoAddress, debugLog: number, retryCount: number, callBack: (success: number) => any) {
        if (retryCount == 0) {
            if (debugLog == 1) {
                this.log('ReadS7() - Retry counter reached max value');
            }
            callBack(ErrorNumber.noData);
            return ErrorNumber.noData;
        }
        retryCount = retryCount - 1;
        // s7client.DBRead(db, target.addr, target_len, (err: Error, res: [number]) => {
                       // Area,    DBNumber, Start,       Amount, WordLen
        s7client.ReadArea(Area.S7AreaDB, db, target.addr, 1,      target.wLenR, (err, data) => {
            if(err) {
                if ((debugLog == 1) && (retryCount == 1)) {
                    this.log('ReadS7() - ReadArea failed. Code #' + err + ' - ' + this.s7client.ErrorText(err));
                }
                if ((debugLog == 1) && (retryCount > 1)) {
                    this.log('ReadS7() - ReadArea failed. Retrying. (%i)', retryCount);
                }
                sleep(100).then(() => {
                    //s7client.Disconnect();
                    //this.ConnectS7(s7client, debugLog, 5,(success: Boolean) => {
                    //    if (success) {
                            this.ReadS7(s7client, db, target, debugLog, retryCount, callBack);
                    //    }
                    //});
                });
            } else {
                var buffer = Buffer.from(data);
                if (target.wLen == WordLen.S7WLBit) {
                    callBack((buffer[0] >> target.bit) & 1);
                }
                if (target.wLen == WordLen.S7WLByte) {
                    callBack(buffer[0]);
                }
                if (target.wLen == WordLen.S7WLWord) {
                    callBack( (buffer[0] << 8) | buffer[1] );
                }
                if (target.wLen == WordLen.S7WLDWord) {
                    callBack( (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3] );
                }
                callBack(ErrorNumber.noData);
            }
        });
    }

    WriteS7(s7client: any, db: number, target: LogoAddress, debugLog: number, retryCount: number, buffer: Buffer, callBack?: (success: Boolean) => any) {
        if (retryCount == 0) {
            if (debugLog == 1) {
                this.log('WriteS7() - Retry counter reached max value');
            }
            if (callBack) {
                callBack(false);
            }
            return ErrorNumber.noData;
        }

        this.log('WriteS7()');
        this.log(buffer);

        retryCount = retryCount - 1;
        // org // s7client.DBWrite(db, start, size, buffer, (err: Error) => {
                        // Area,    DBNumber, Start,       Amount, WordLen,    Buffer);
        s7client.WriteArea(Area.S7AreaDB, db, target.addr, 1,      0x02, buffer, (err) => {

            this.log('WriteS7()');
            this.log(err);

            if(err) {
                if ((debugLog == 1) && (retryCount == 1)) {
                    this.log('WriteS7() - DBWrite failed. Code #' + err + ' - ' + s7client.ErrorText(err));
                }
                if ((debugLog == 1) && (retryCount > 1)) {
                    this.log('WriteS7() - DBWrite failed. Retrying. (%i)', retryCount);
                }
                sleep(100).then(() => {
                    //s7client.Disconnect();
                    //this.ConnectS7(s7client, debugLog, 5,(success: Boolean) => {
                    //    if (success) {
                            this.WriteS7(s7client, db, target, debugLog, retryCount, buffer, callBack);
                    //    }
                    //});
                });
            }
            if (callBack) {
                callBack(true);
            }
        });
    }

    getAddressAndBit(name: string, target_type: string): LogoAddress {

        if (name.match("AI[0-9]{1,2}")) {
            var num = parseInt(name.replace("AI", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateWord(926, num);
            } else {
                return Snap7Logo.calculateWord(1032, num);
            }
        }

        if (name.match("AQ[0-9]{1,2}")) {
            var num = parseInt(name.replace("AQ", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateWord(944, num);
            } else {
                return Snap7Logo.calculateWord(1072, num);
            }
        }

        if (name.match("AM[0-9]{1,2}")) {
            var num = parseInt(name.replace("AM", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateWord(952, num);
            } else {
                return Snap7Logo.calculateWord(1118, num);
            }
        }

        if (name.match("I[0-9]{1,2}")) {
            var num = parseInt(name.replace("I", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateBit(923, num);
            } else {
                return Snap7Logo.calculateBit(1024, num);
            }
        }

        if (name.match("Q[0-9]{1,2}")) {
            var num = parseInt(name.replace("Q", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateBit(942, num);
            } else {
                return Snap7Logo.calculateBit(1064, num);
            }
        }

        if (name.match("M[0-9]{1,2}")) {
            var num = parseInt(name.replace("M", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateBit(948, num);
            } else {
                return Snap7Logo.calculateBit(1104, num);
            }
        }

        if (name.match("V[0-9]{1,4}\.[0-7]{1}")) {
            var str = name.replace("V", "");
            var a = parseInt(str.split(".", 2)[0], 10);
            var b = parseInt(str.split(".", 2)[1], 10);
            return new LogoAddress(a, b, WordLen.S7WLBit, WordLen.S7WLByte);
        }

        if (name.match("VB[0-9]{1,4}")) {
            var num = parseInt(name.replace("VB", ""), 10)
            return new LogoAddress(num, 0, WordLen.S7WLByte, WordLen.S7WLByte);
        }

        if (name.match("VW[0-9]{1,4}")) {
            var num = parseInt(name.replace("VW", ""), 10)
            return new LogoAddress(num, 0, WordLen.S7WLWord, WordLen.S7WLWord);
        }

        if (name.match("VD[0-9]{1,4}")) {
            var num = parseInt(name.replace("VD", ""), 10)
            return new LogoAddress(num, 0, WordLen.S7WLDWord, WordLen.S7WLDWord);
        }

        return new LogoAddress(0, 0, WordLen.S7WLBit, WordLen.S7WLByte);
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

    getWordSize(wordLen: Number) {
        switch (wordLen) {
            case WordLen.S7WLBit:
            case WordLen.S7WLByte:
                return 1;
            case WordLen.S7WLWord:
            case WordLen.S7WLCounter:
            case WordLen.S7WLTimer:
                return 2;
            case WordLen.S7WLDWord:
            case WordLen.S7WLReal:
                return 4;
            default:
                return 0;
        }
    }

    static calculateBit(base: number, num: number) {
        var x = Math.floor((num - 1) / 8);
        var y = 8 * (x + 1);
        var addr = base + x;
        var bit = 7 - (y - num);
        return new LogoAddress(addr, bit, WordLen.S7WLBit, WordLen.S7WLByte);
    }

    static calculateWord(base: number, num: number) {
        var addr = base + ((num - 1) * 2);
        return new LogoAddress(addr, 0, WordLen.S7WLWord, WordLen.S7WLWord);
    }

}

const sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

