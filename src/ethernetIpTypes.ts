// ethernetIpTypes.ts

// Encapsulation Header
export interface EncapsulationHeader {
    command: number;
    length: number;
    sessionHandle: number;
    status: number;
    senderContext: Uint8Array;
    options: number;
  }
  
  // CIP Message
  export interface CIPMessage {
    service: number;
    path: Uint8Array;
    data?: Uint8Array;
  }
  
  // Forward Open Request
  export interface ForwardOpenRequest {
    timeout: number;
    otConnectionId: number;
    toConnectionId: number;
    connectionSerialNumber: number;
    originatorVendorId: number;
    originatorSerialNumber: number;
    connectionTimeout: number;
    otRPI: number;
    otNetworkConnectionParams: number;
    toRPI: number;
    toNetworkConnectionParams: number;
    transportTypeTrigger: number;
    connectionPathSize: number;
    connectionPath: Uint8Array;
  }
  
  // Connection Parameters
  export interface ConnectionParameters {
    tToORPI: number;
    oToTRPI: number;
    tToOSize: number;
    oToTSize: number;
    transportClass: number;
  }
  
  // Session Info
  export interface SessionInfo {
    sessionHandle: number;
    originatorSerialNumber: number;
    originatorVendorId: number;
    connectionSerialNumber: number;
    otConnectionId: number;
    toConnectionId: number;
  }
  
  // Device Info
  export interface DeviceInfo {
    vendorId: number;
    deviceType: number;
    productCode: number;
    revision: {
      major: number;
      minor: number;
    };
    status: number;
    serialNumber: number;
    productName: string;
  }
  
  // Enum for Connection Types
  export enum ConnectionType {
    NULL = 0,
    MULTICAST = 1,
    POINT_TO_POINT = 2,
  }
  
  // Enum for Connection Priority
  export enum ConnectionPriority {
    LOW = 0,
    HIGH = 1,
    SCHEDULED = 2,
    URGENT = 3,
  }
  
  // Type for CIP Path Segment
  export type CIPPathSegment = {
    type: number;
    value: number;
  };