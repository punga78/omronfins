export interface CIPPacket {
    service: number;
    path: Buffer;
    data: Buffer;
  }
  
  export abstract class BaseOperation {
    protected sessionHandle: number;
  
    constructor(sessionHandle: number) {
      this.sessionHandle = sessionHandle;
    }
  
    abstract generatePacket(): CIPPacket;
    abstract parseResponse(response: Buffer): any;
  
    getPacket(): CIPPacket {
      return this.generatePacket();
    }
  }
  