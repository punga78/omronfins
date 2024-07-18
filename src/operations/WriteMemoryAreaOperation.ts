import { AddressDecoder } from '../AddressDecoder';
import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, SegmentType } from '../ethernetIpConstants';

export class WriteMemoryAreaOperation extends BaseOperation {
    private address: string;
    private data: number[];

    constructor(sessionHandle: number, address: string, data: number[]) {
        super(sessionHandle);
        this.address = address;
        this.data = data;
    }
    private numberToBuffer(num: number, length: number): Buffer {
        const buf = Buffer.alloc(length);
        buf.writeUIntLE(num, 0, length);
        return buf;
    }

    decodeAddress(address: string): { area: number; offset: number; } {
        const areadecoder = new AddressDecoder("C");
        const { area, offset } = areadecoder.decodeAddress(address);
        return { area, offset };
    }

    generatePacket(): CIPPacket {
        const { area, offset } = this.decodeAddress(this.address);
        const path = Buffer.from([SegmentType.CLASS_ID, area, SegmentType.INSTANCE_ID, ...this.numberToBuffer(offset, 2)]);
        const writeData = Buffer.alloc(this.data.length * 2);

        for (let i = 0; i < this.data.length; i++) {
            writeData.writeUInt16LE(this.data[i], i * 2);
        }

        return {
            service: CIPService.SET_ATTRIBUTE_ALL,
            path: path,
            data: writeData
        };
    }

    parseResponse(response: Buffer): any {
        // Analizza la risposta per estrarre i dettagli della scrittura
        // Questo è un esempio generico e potrebbe necessitare di adattamenti specifici
        if (response.length === 0 || response.readUInt8(0) !== 0) {
            throw new Error('Memory area write failed');
        }
        return true;
    }
}
