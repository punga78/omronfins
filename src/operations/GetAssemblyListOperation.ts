import { BaseOperation, CIPPacket } from './BaseOperation';
import { AssemblyInfo, AssemblyType, CIPService, ObjectClass, SegmentType } from '../ethernetIpConstants';

export class GetAssemblyListOperation extends BaseOperation {

    constructor(sessionHandle: number) {
        super(sessionHandle);
    }

    generatePacket(): CIPPacket {
        const path = Buffer.from([SegmentType.CLASS_ID, ObjectClass.ASSEMBLY, SegmentType.INSTANCE_ID, 0x00]);
        return {
            service: CIPService.GET_ATTRIBUTE_ALL,
            path: path,
            data: Buffer.alloc(0) // Nessun dato per questa richiesta
        };
    }

    private getAssemblyType(instanceId: number): AssemblyType {
        // Questa è una semplificazione. La logica esatta dipenderà 
        // dal modello specifico del PLC Omron
        if (instanceId >= 100 && instanceId < 200) {
            return AssemblyType.INPUT;
        } else if (instanceId >= 200 && instanceId < 300) {
            return AssemblyType.OUTPUT;
        } else if (instanceId >= 300 && instanceId < 400) {
            return AssemblyType.CONFIG;
        } else {
            return AssemblyType.UNKNOWN;
        }
    }

    parseResponse(response: Buffer): AssemblyInfo[] {
        const assemblies: AssemblyInfo[] = [];
        let offset = 0;

        // Saltiamo i primi 2 byte che indicano il numero di attributi
        offset += 2;

        while (offset < response.length) {
            const instanceId = response.readUInt16LE(offset);
            offset += 2;

            const size = response.readUInt16LE(offset);
            offset += 2;

            const type = this.getAssemblyType(instanceId);

            assemblies.push({
                instanceId,
                size,
                type
            });
        }

        return assemblies;
    }

}
