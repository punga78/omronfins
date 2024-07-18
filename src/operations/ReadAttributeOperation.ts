import { BaseOperation, CIPPacket } from './BaseOperation';
import { CIPService, LogicalSegmentFormat, LogicalSegmentType, SegmentType } from '../ethernetIpConstants';

export class ReadAttributeOperation extends BaseOperation {
  private classId: number;
  private instanceId: number;
  private attributeId: number;

  constructor(sessionHandle: number, classId: number, instanceId: number, attributeId: number) {
    super(sessionHandle);
    this.classId = classId;
    this.instanceId = instanceId;
    this.attributeId = attributeId;
  }

  private createAttributePath(classId: number, instanceId: number, attributeId: number): Buffer {
    return Buffer.from([
        SegmentType.LOGICAL_SEGMENT | LogicalSegmentType.CLASS_ID | LogicalSegmentFormat.EIGHT_BIT,
        classId,
        SegmentType.LOGICAL_SEGMENT | LogicalSegmentType.INSTANCE_ID | LogicalSegmentFormat.EIGHT_BIT,
        instanceId,
        SegmentType.LOGICAL_SEGMENT | LogicalSegmentType.ATTRIBUTE_ID | LogicalSegmentFormat.EIGHT_BIT,
        attributeId
    ]);
}

  generatePacket(): CIPPacket {
    const path = this.createAttributePath(this.classId, this.instanceId, this.attributeId);
    return {
      service: CIPService.GET_ATTRIBUTE_SINGLE, // Esempio di servizio CIP per la lettura degli attributi
      path: path,
      data: Buffer.alloc(0) // Dati vuoti per l'operazione di lettura
    };
  }

  parseResponse(response: Buffer): any {
    // In base alla struttura della risposta CIP, potresti voler decodificare diversamente
    // Questo è solo un esempio generico
    return response;
  }
}
