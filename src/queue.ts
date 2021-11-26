export class QueueItem {
    public address:   string;
    public send:      boolean;
    public value:     number;
    public callBack: (value: number) => any;

    constructor(address: string, send: boolean, value: number, callBack?: (value: number) => any) {
        this.address = address;
        this.send    = send;
        this.value   = value;
        if (callBack) {
            this.callBack = callBack;    
        } else {
            this.callBack = function (){};
        }
    }

}

export class Queue {
    items: any[];

    constructor(...params: any[]) {
        this.items = [...params];
    }

    bequeue(item: any) {
        this.items.unshift(item);
    }

    enqueue(item: any) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    count() {
        return this.items.length;
    }

    getItems(){
        return this.items
    }

}