import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, CONNECTION_MANAGER_PATH, CONNECTION_PATH_SIZE, CONNECTION_TIMEOUT_MULTIPLIER, ConnectionType, DEFAULT_PRIORITY_TIME_TICK, HEADER_FORMAT_32BIT, ObjectClass, SegmentType, TransportClass, TriggerType, VendorID } from '../ethernetIpConstants';

export class EstablishIOConnectionOperation extends BaseOperation {
    private assemblyInstance: number;
    private rpi: number;
    private isProducer: boolean

    constructor(sessionHandle: number, assemblyInstance: number, rpi: number, isProducer: boolean) {
        super(sessionHandle);
        this.assemblyInstance = assemblyInstance;
        this.rpi = rpi;
        this.isProducer = isProducer;
    }

    private createConnectionRequestData(assemblyInstance: number, rpi: number, isProducer: boolean): Buffer {
        const data = Buffer.alloc(42);
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
        data.writeUInt32LE(Math.floor(Math.random() * 0xFFFFFFFF), offset);
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
        const o2tNetworkParams = ConnectionType.POINT_TO_POINT | HEADER_FORMAT_32BIT | (isProducer ? 0x02 : 0x00);
        data.writeUInt32LE(o2tNetworkParams, offset);
        offset += 4;

        // T->O RPI (in microsecondi)
        data.writeUInt32LE(rpi * 1000, offset);
        offset += 4;

        // T->O Network Connection Parameters
        const t2oNetworkParams = ConnectionType.POINT_TO_POINT | HEADER_FORMAT_32BIT | (isProducer ? 0x00 : 0x02);
        data.writeUInt32LE(t2oNetworkParams, offset);
        offset += 4;

        // Transport Type/Trigger
        data.writeUInt8(TransportClass.CLASS_1 | TriggerType.CYCLIC, offset);
        offset += 1;

        // Connection Path Size (in 16-bit words)
        data.writeUInt8(CONNECTION_PATH_SIZE, offset);
        offset += 1;

        // Connection Path
        data.writeUInt8(SegmentType.CLASS_ID, offset);
        offset += 1;
        data.writeUInt8(ObjectClass.ASSEMBLY, offset);
        offset += 1;
        data.writeUInt8(SegmentType.INSTANCE_ID, offset);
        offset += 1;
        data.writeUInt8(assemblyInstance, offset);
        offset += 1;
        data.writeUInt8(SegmentType.CONFIGURATION, offset);
        offset += 1;
        data.writeUInt8(0x01, offset); // Configuration Instance 1
        offset += 1;

        return data;
    }

    generatePacket(): CIPPacket {
        const path = CONNECTION_MANAGER_PATH;
        const connectionData = this.createConnectionRequestData(this.assemblyInstance, this.rpi, this.isProducer);

        return {
            service: CIPService.FORWARD_OPEN,
            path: path,
            data: connectionData
        };
    }

    parseResponse(response: Buffer): any {
        // Analizza la risposta per estrarre i dettagli della connessione
        return response.readUInt32LE(0);
        
        const connectionId = response.readUInt32LE(0);
        const connectionStatus = response.readUInt32LE(4);
        return {
            connectionId: connectionId,
            connectionStatus: connectionStatus
        };
    }
}
