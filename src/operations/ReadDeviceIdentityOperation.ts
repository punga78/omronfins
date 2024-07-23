import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, DeviceIdentity, ObjectClass, SegmentType } from '../ethernetIpConstants';

export class ReadDeviceIdentityOperation extends BaseOperation {

    constructor(sessionHandle: number) {
        super(sessionHandle);
    }

    generatePacket(): CIPPacket {
        // Questo esempio presuppone un servizio e una path specifici per ottenere l'identità del dispositivo.
        const path = Buffer.from([SegmentType.CLASS_ID, ObjectClass.IDENTITY, SegmentType.INSTANCE_ID, 0x01]); // Path generica per leggere l'identità del dispositivo (slot 0)
        return {
            service: CIPService.GET_ATTRIBUTE_ALL,
            path: path,
            data: Buffer.alloc(0) // Nessun dato per questa richiesta
        };
    }


    private parseRevision(revision: number): string {
        const major = (revision >> 8) & 0xFF;
        const minor = revision & 0xFF;
        return `${major}.${minor}`;
    }

    private parseProductName(data: Buffer): string {
        const length = data[0];
        return data.subarray(1, 1 + length).toString('ascii');
    }


    parseResponse(response: Buffer): DeviceIdentity {
        let offset = 2;

        const identity: DeviceIdentity = {
            vendorId: response.readUInt16LE(offset),
            deviceType: response.readUInt16LE(offset += 2),
            productCode: response.readUInt16LE(offset += 2),
            revision: this.parseRevision(response.readUInt16LE(offset += 2)),
            status: response.readUInt16LE(offset += 2),
            serialNumber: response.readUInt32LE(offset += 2).toString(16).toUpperCase(),
            productName: this.parseProductName(response.subarray(offset += 4))
        };

        return identity;
    }
}
