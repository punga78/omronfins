import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, CONNECTION_MANAGER_PATH, CONNECTION_PATH_SIZE, CONNECTION_TIMEOUT_MULTIPLIER, ConnectionType, DEFAULT_PRIORITY_TIME_TICK, HEADER_FORMAT_32BIT, InstanceID, ObjectClass, SegmentType, TransportClass, TriggerType, VendorID } from '../ethernetIpConstants';

export class EstablishIOConnectionOperation extends BaseOperation {
    private assemblyInstance: number;
    private rpi: number;
    private isProducer: boolean
    private large: boolean
    

    constructor(sessionHandle: number,large: boolean, assemblyInstance: number, rpi: number, isProducer: boolean) {
        super(sessionHandle);
        this.assemblyInstance = assemblyInstance;
        this.rpi = rpi;
        this.isProducer = isProducer;
        this.large = large;
    }

    private createConnectionRequestData(assemblyInstance: number, rpi: number, isProducer: boolean): Buffer {
        const data = Buffer.alloc(46);
        let offset = 0;

        // Priority/TimeOut ticks
        data.writeUInt16LE(DEFAULT_PRIORITY_TIME_TICK, offset);
        offset += 2;

        // O->T Network Connection ID (non utilizzato per Forward_Open, impostato a 0)
        data.writeUInt32LE(0, offset);
        offset += 4;

        // T->O Network Connection ID (non utilizzato per Forward_Open, impostato a 0)
        data.writeUInt32LE(0, offset);
        offset += 4;

        // Connection Serial Number (numero casuale unico per questa connessione)
        const connectionSerial = Math.floor(Math.random() * 0xFFFF);
        data.writeUInt16LE(connectionSerial, offset);
        offset += 2;

        // Originator Vendor ID
        data.writeUInt16LE(VendorID.OMRON, offset);
        offset += 2;

        // Originator Serial Number (numero casuale)
        data.writeUInt32LE(0, offset);
        offset += 4;

        // Connection Timeout Multiplier
        data.writeUInt8(CONNECTION_TIMEOUT_MULTIPLIER, offset);
        offset += 1;

        // Reserved (3 bytes)
        offset += 3;

        // O->T RPI (in microsecondi)
        data.writeUInt32LE(rpi * 1000, offset);
        offset += 4;

        // O->T Network Connection Parameters
        const o2tNetworkParams = 0x420007CC;// (isProducer ? 0x02 : 0x00);
        data.writeUInt32LE(o2tNetworkParams, offset);
        offset += 4;

        // T->O RPI (in microsecondi)
        data.writeUInt32LE(rpi * 1000, offset);
        offset += 4;

        // T->O Network Connection Parameters
        const t2oNetworkParams = 0x420007CC;//(isProducer ? 0x00 : 0x02);
        data.writeUInt32LE(t2oNetworkParams, offset);
        offset += 4;

        // Transport Type/Trigger
        data.writeUInt8(0xA3, offset);
        offset += 1;

        // Connection Path Size (in 16-bit words)
        data.writeUInt8(3, offset);
        offset += 1;

        // Connection Path
        data.writeUInt16LE(SegmentType.PORT_SEGMENT, offset);
        offset += 2;
        data.writeUInt8(SegmentType.CLASS_ID, offset);
        offset += 1;
        data.writeUInt8(ObjectClass.MESSAGE_ROUTER, offset);
        offset += 1;
        data.writeUInt8(SegmentType.INSTANCE_ID, offset);
        offset += 1;
        data.writeUInt8(InstanceID.CONNECTION_MANAGER, offset);

        return data;
    }

    generatePacket(): CIPPacket {
        const path = CONNECTION_MANAGER_PATH;
        const connectionData = this.createConnectionRequestData(this.assemblyInstance, this.rpi, this.isProducer);

        return {
            service: this.large ? CIPService.LARGE_FORWARD_OPEN : CIPService.FORWARD_OPEN,
            path: path,
            data: connectionData
        };
    }

    parseResponse(response: Buffer): any {
        return response.readUInt32LE(2);
    }
}
