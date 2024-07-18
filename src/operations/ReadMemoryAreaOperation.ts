import { AddressDecoder } from '../AddressDecoder';
import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, SegmentType } from '../ethernetIpConstants';

export class ReadMemoryAreaOperation extends BaseOperation {
    private address: string;
    private size: number;

    constructor(sessionHandle: number,  address: string, size: number) {
        super(sessionHandle);
        this.address = address;
        this.size = size;
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
        const data = Buffer.from([...this.numberToBuffer(this.size, 2)]);

        return {
            service: CIPService.GET_ATTRIBUTE_ALL,
            path: path,
            data: data
        };
    }

    parseResponse(response: Buffer): number[] {
        const result: number[] = [];
        for (let i = 0; i < response.length; i += 2) {
            result.push(response.readUInt16LE(i));
        }
        return result;
    }
}
