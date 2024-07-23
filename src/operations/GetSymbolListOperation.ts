import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, ObjectClass, SegmentType } from '../ethernetIpConstants';

export class GetSymbolListOperation extends BaseOperation {

    constructor(sessionHandle: number) {
        super(sessionHandle);
    }

    generatePacket(): CIPPacket {
        const path = Buffer.from([SegmentType.CLASS_ID, ObjectClass.SYMBOL, SegmentType.INSTANCE_ID, 0x01, 0x91, 0x00]);
        return {
            service: CIPService.GET_ATTRIBUTE_ALL,
            path: path,
            data: Buffer.alloc(0) // Nessun dato per questa richiesta
        };
    }

    parseResponse(response: Buffer): string[] {
        const symbolList: string[] = [];
        let offset = 2; // Skip the first two bytes (number of symbols)
        while (offset < response.length) {
            const symbolLength = response.readUInt8(offset);
            offset++;
            const symbolName = response.subarray(offset, offset + symbolLength).toString('ascii');
            symbolList.push(symbolName);
            offset += symbolLength;
            // Skip symbol type and other metadata
            offset += 8;
        }
        return symbolList;
    }
}
