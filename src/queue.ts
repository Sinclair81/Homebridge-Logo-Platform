export class QueueSendItem {
    public address:    string;
    public value:      number;
    public pushButton: number;

    constructor(address: string, value: number, pushButton: number) {
        this.address    = address;
        this.value      = value;
        this.pushButton = pushButton;
    }
}

export class QueueReceiveItem {
    public address: string;
    public callBack: (value: number) => any;

    constructor(address: string, callBack: (value: number) => any) {
        this.address  = address;
        this.callBack = callBack;
    }
}

export class Queue {
    items: any[];
    capacity: number;

    constructor(capacity: number, ...params: any[]) {
        this.capacity = capacity;
        this.items = [...params];
    }

    bequeue(item: any) {
        this.items.unshift(item);
    }

    enqueue(item: any) {
        if (this.items.length < this.capacity) {
            this.items.push(item);
            return 1;
        }
        return 0;
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