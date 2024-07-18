import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, ObjectClass, SegmentType } from '../ethernetIpConstants';

export class ConfigureAssemblyOperation extends BaseOperation {
  private assemblyInstanceId: number;
  private configurationData: Buffer;

  constructor(sessionHandle: number, assemblyInstanceId: number, configurationData: Buffer) {
    super(sessionHandle);
    this.assemblyInstanceId = assemblyInstanceId;
    this.configurationData = configurationData;
  }

  generatePacket(): CIPPacket {
    const path = Buffer.from([SegmentType.CLASS_ID, ObjectClass.ASSEMBLY, SegmentType.INSTANCE_ID, this.assemblyInstanceId, 0x30, 0x03]); // Path per accedere all'assembly specificato
    return {
      service: CIPService.SET_ATTRIBUTE_SINGLE,
      path: path,
      data: this.configurationData
    };
  }

  parseResponse(response: Buffer): any {
    // Analizza la risposta per estrarre i dettagli della configurazione
    // Questo è un esempio generico e potrebbe necessitare di adattamenti specifici
    if (response.length === 0 || response.readUInt8(0) !== 0) {
      throw new Error('Assembly configuration failed');
    }
    return true;
  }
}
