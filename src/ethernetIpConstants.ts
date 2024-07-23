// ethernetip-constants.ts

// Porte predefinite
export const DEFAULT_TCP_PORT = 44818;
export const DEFAULT_UDP_PORT = 2222;

// Protocolli
export enum Protocol {
  TCP = 'tcp',
  UDP = 'udp'
}

// Tipi di messaggi
export enum MessageType {
  EXPLICIT = 'explicit',
  IMPLICIT = 'implicit'
}

// Servizi CIP comuni
export enum CIPService {
  // Common Services
  GET_ATTRIBUTE_ALL = 0x01,
  SET_ATTRIBUTE_ALL = 0x02,
  GET_ATTRIBUTE_LIST = 0x03,
  SET_ATTRIBUTE_LIST = 0x04,
  RESET = 0x05,
  START = 0x06,
  STOP = 0x07,
  CREATE = 0x08,
  DELETE = 0x09,
  MULTIPLE_SERVICE_PACKET = 0x0A,
  APPLY_ATTRIBUTES = 0x0D,
  GET_ATTRIBUTE_SINGLE = 0x0E,
  SET_ATTRIBUTE_SINGLE = 0x10,
  FIND_NEXT_OBJECT_INSTANCE = 0x11,
  RESTORE = 0x15,
  SAVE = 0x16,
  NO_OPERATION = 0x17,
  GET_MEMBER = 0x18,
  SET_MEMBER = 0x19,
  INSERT_MEMBER = 0x1A,
  REMOVE_MEMBER = 0x1B,
  GROUP_SYNC = 0x1C,

  // Connection Manager Specific Services
  FORWARD_OPEN = 0x54,
  FORWARD_CLOSE = 0x4E,
  UNCONNECTED_SEND = 0x52,
  GET_CONNECTION_DATA = 0x56,
  SEARCH_CONNECTION_DATA = 0x57,
  GET_CONNECTION_OWNER = 0x5A,
  LARGE_FORWARD_OPEN = 0x5B,

  // File Object Services
  INITIATE_UPLOAD = 0x4B,
  INITIATE_DOWNLOAD = 0x4C,
  UPLOAD_TRANSFER = 0x4D,
  DOWNLOAD_TRANSFER = 0x4E,
  CLEAR_FILE = 0x4F,

  // Router Object Services
  GET_ATTRIBUTE_SINGLE_HEX = 0x0E,
  SET_ATTRIBUTE_SINGLE_HEX = 0x10,

  // Modbus Object Services
  READ_DISCRETE_INPUTS = 0x4B,
  READ_COILS = 0x4C,
  READ_INPUT_REGISTERS = 0x4D,
  READ_HOLDING_REGISTERS = 0x4E,
  WRITE_COILS = 0x4F,
  WRITE_HOLDING_REGISTERS = 0x50,
  MASKED_WRITE_REGISTER = 0x51,
  READ_WRITE_MULTIPLE_REGISTERS = 0x52,

  // DeviceNet Specific Services
  ALLOCATE_MASTER_SLAVE_CONNECTION_SET = 0x4B,
  RELEASE_GROUP_2_IDENTIFIER_SET = 0x4C,

  // TCP/IP Interface Object Services
  GET_ATTRIBUTE_ALL_HEX = 0x01,
  SET_ATTRIBUTE_ALL_HEX = 0x02,
  GET_ATTRIBUTE_LIST_HEX = 0x03,
  SET_ATTRIBUTE_LIST_HEX = 0x04,
  RESET_HEX = 0x05,

  // Ethernet Link Object Services
  GET_AND_CLEAR = 0x4C,

  // Time Sync Object Services
  SET_SYSTEM_TIME = 0x48,
  GET_SYSTEM_TIME = 0x49,
  TIME_SYNC_CHASSIS_SYNC = 0x4B,

  // Vendor Specific Services
  EXECUTE = 0x4E,
  FLASH_UPDATE = 0x50
}


export enum EtherNetIPCommand {
  NOP = 0x00,
  LIST_SERVICES = 0x04,
  LIST_IDENTITY = 0x63,
  LIST_INTERFACES = 0x64,
  REGISTER_SESSION = 0x65,
  UNREGISTER_SESSION = 0x66,
  SEND_RR_DATA = 0x6F,
  SEND_UNIT_DATA = 0x70
}

// Struttura di un pacchetto EtherNet/IP
export interface EtherNetIPPacket {
  command: number;
  length: number;
  sessionHandle: number;
  status: number;
  senderContext: Buffer;
  options: number;
  data: Buffer;
  commandSpecificData?: CommandSpecificData;
}

export type CommandSpecificData = 
  | ListServicesData
  | RegisterSessionData
  | SendData
  | null;

export interface ListServicesData {
  interfaceHandle: number;
  timeout: number;
}

export interface RegisterSessionData {
  protocolVersion: number;
  optionFlags: number;
}

export interface SendData {
  interfaceHandle: number;
  timeout: number;
  items: DataItem[];
}


export interface DataItem {
  type: number;
  length: number;
  data: Buffer;
}

// Struttura di un messaggio CIP
export interface CIPMessage {
  service: CIPService;
  path: Buffer;
  data: Buffer;
}

// Struttura di una connessione EtherNet/IP
export interface EtherNetIPConnection {
  connectionId: number;
  connectionSerialNumber: number;
  originatorVendorId: number;
  originatorSerialNumber: number;
  connectionTimeout: number;
  o2tRPI: number;
  t2oRPI: number;
  transportClass: number;
}

export interface ServiceInfo {
  serviceType: number;
  serviceName: string;
  capabilities: string[];
}

// Tipi di connessione
export enum ConnectionType {
  NULL = 0,
  MULTICAST = 1,
  POINT_TO_POINT = 2
}

// Priorità di connessione
export enum ConnectionPriority {
  LOW = 0,
  HIGH = 1,
  SCHEDULED = 2,
  URGENT = 3
}

// Codici di stato generali
export enum GeneralStatusCode {
  SUCCESS = 0x00,
  CONNECTION_FAILURE = 0x01,
  RESOURCE_UNAVAILABLE = 0x02,
  INVALID_PARAMETER_VALUE = 0x03,
  PATH_SEGMENT_ERROR = 0x04,
  PATH_DESTINATION_UNKNOWN = 0x05,
  PARTIAL_TRANSFER = 0x06,
  CONNECTION_LOST = 0x07,
  SERVICE_NOT_SUPPORTED = 0x08,
  INVALID_ATTRIBUTE_VALUE = 0x09,
  ATTRIBUTE_LIST_ERROR = 0x0A,
  ALREADY_IN_REQUESTED_MODE = 0x0B,
  OBJECT_STATE_CONFLICT = 0x0C,
  OBJECT_ALREADY_EXISTS = 0x0D,
  ATTRIBUTE_NOT_SETTABLE = 0x0E,
  PRIVILEGE_VIOLATION = 0x0F,
  DEVICE_STATE_CONFLICT = 0x10,
  REPLY_DATA_TOO_LARGE = 0x11,
  FRAGMENTATION_OF_A_PRIMITIVE_VALUE = 0x12,
  NOT_ENOUGH_DATA = 0x13,
  ATTRIBUTE_NOT_SUPPORTED = 0x14,
  TOO_MUCH_DATA = 0x15,
  OBJECT_DOES_NOT_EXIST = 0x16,
  SERVICE_FRAGMENTATION_SEQUENCE_NOT_IN_PROGRESS = 0x17,
  NO_STORED_ATTRIBUTE_DATA = 0x18,
  STORE_OPERATION_FAILURE = 0x19
}

// Mappa degli errori CIP con le loro descrizioni
export const CIP_ERRORS: { [key: number]: string } = {
  0x00: "Success",
  0x01: "Connection Failure",
  0x02: "Resource Unavailable",
  0x03: "Invalid parameter value",
  0x04: "Path segment error",
  0x05: "Path destination unknown",
  0x06: "Partial Transfer",
  0x07: "Connection Lost",
  0x08: "Service Not Supported",
  0x09: "Invalid Attribute Value",
  0x0A: "Attribute List Error",
  0x0B: "Already In Requested Mode",
  0x0C: "Object State Conflict",
  0x0D: "Object Already Exists",
  0x0E: "Attribute Not Settable",
  0x0F: "Privilege Violation",
  0x10: "Device State Conflict",
  0x11: "Reply Data Too Large",
  0x12: "Fragmentation of a Primitive Value",
  0x13: "Not Enough Data",
  0x14: "Attribute Not Supported",
  0x15: "Too Much Data",
  0x16: "Object Does Not Exist",
  0x17: "Service Fragmentation Sequence Not In Progress",
  0x18: "No Stored Attribute Data",
  0x19: "Store Operation Failure",
  0x1A: "Routing Failure (request packet too large)",
  0x1B: "Routing Failure (response packet too large)",
  0x1C: "Missing attribute list entry data",
  0x1D: "Invalid attribute value list",
  0x1E: "Embedded service error",
  0x1F: "Vendor specific error",
  0x20: "Invalid parameter",
  0x21: "Write-once value or medium already written",
  0x22: "Invalid Reply Received",
  0x25: "Key Failure in path"
};

export interface DeviceIdentity {
  vendorId: number;
  deviceType: number;
  productCode: number;
  revision: string;
  status: number;
  serialNumber: string;
  productName: string;
}


export enum AssemblyType {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  CONFIG = 'CONFIG',
  UNKNOWN = 'UNKNOWN'
}

export interface AssemblyInfo {
  instanceId: number;
  size: number;
  type: AssemblyType;
}

// Definiamo prima alcuni enumeratori e costanti

export enum VendorID {
  OMRON = 0x0000,
  // Aggiungi altri vendor ID se necessario
}



export enum TransportClass {
  CLASS_1 = 0x01,
  CLASS_3 = 0x03,
}

export enum TriggerType {
  CYCLIC = 0x00,
  CHANGE_OF_STATE = 0x01,
  APPLICATION_OBJECT = 0x02,
}


export enum ObjectClass {
  // Common CIP Objects
  IDENTITY = 0x01,
  MESSAGE_ROUTER = 0x02,
  ASSEMBLY = 0x04,
  CONNECTION = 0x05,
  CONNECTION_MANAGER = 0x06,
  REGISTER = 0x07,
  PARAMETER = 0x0F,
  PARAMETER_GROUP = 0x10,
  GROUP = 0x12,
  DISCRETE_INPUT_POINT = 0x08,
  DISCRETE_OUTPUT_POINT = 0x09,
  ANALOG_INPUT_POINT = 0x0A,
  ANALOG_OUTPUT_POINT = 0x0B,
  PRESENCE_SENSING = 0x0E,
  POSITION_CONTROLLER_SUPERVISOR = 0x13,
  POSITION_CONTROLLER = 0x14,
  BLOCK_SEQUENCER = 0x15,
  COMMAND_BLOCK = 0x16,
  MOTOR_DATA = 0x17,
  CONTROL_SUPERVISOR = 0x18,
  AC_DC_DRIVE = 0x19,
  ACKNOWLEDGE_HANDLER = 0x2B,
  OVERLOAD = 0x2C,
  SOFTSTART = 0x2D,
  SELECTION = 0x2E,
  S_DEVICE_SUPERVISOR = 0x30,
  S_ANALOG_SENSOR = 0x31,
  S_ANALOG_ACTUATOR = 0x32,
  SINGLE_STAGE_CONTROLLER = 0x33,
  GAS_CALIBRATION = 0x34,
  TRIP_POINT = 0x35,
  FILE = 0x37,
  SYMBOL = 0x6B,
  TIME_SYNC = 0x43,
  DIAGNOSTIC = 0x44,

  // Vendor-specific Objects (example range, actual values may vary)
  VENDOR_SPECIFIC_START = 0x64,  // 100 decimal
  VENDOR_SPECIFIC_END = 0xC7,    // 199 decimal

  // Network and Communication Objects
  TCP_IP_INTERFACE = 0xF5,
  ETHERNET_LINK = 0xF6,

  // Safety Objects
  SAFETY_SUPERVISOR = 0x39,
  SAFETY_VALIDATOR = 0x3A,
  SAFETY_DISCRETE_OUTPUT_POINT = 0x3B,
  SAFETY_DISCRETE_OUTPUT_GROUP = 0x3C,
  SAFETY_DISCRETE_INPUT_POINT = 0x3D,
  SAFETY_DISCRETE_INPUT_GROUP = 0x3E,
  SAFETY_DUAL_CHANNEL_OUTPUT = 0x3F,
  SAFETY_DUAL_CHANNEL_INPUT = 0x40,
  SAFETY_ANALOG_INPUT_POINT = 0x41,
  SAFETY_ANALOG_INPUT_GROUP = 0x42,

  // Additional Objects (may be vendor-specific or part of extensions)
  PORT = 0xF4,
  MODBUS_OBJECT = 0x44,
  DFNT_OBJECT = 0xA6,

  // Add any other object classes specific to your Omron devices here
}

export enum InstanceID {
  CONNECTION_MANAGER = 0x01,
  // Aggiungi altri ID di istanza se necessario
}

export enum SegmentType {
  CLASS_ID = 0x20,
  INSTANCE_ID = 0x24,
  CONFIGURATION = 0x2C,
}

export enum SegmentType {
  // Segment Type Bits: 001
  PORT_SEGMENT = 0x01,

  // Segment Type Bits: 010
  LOGICAL_SEGMENT = 0x20,

  // Segment Type Bits: 011
  NETWORK_SEGMENT = 0x40,

  // Segment Type Bits: 100
  SYMBOLIC_SEGMENT = 0x60,

  // Segment Type Bits: 101
  DATA_SEGMENT = 0x80,

  // Segment Type Bits: 110
  DATA_TYPE_CONSTRUCTED = 0xA0,

  // Segment Type Bits: 111
  DATA_TYPE_ELEMENTARY = 0xC0
}

// Logical Segment Format
export enum LogicalSegmentType {
  CLASS_ID = 0x00,
  INSTANCE_ID = 0x04,
  MEMBER_ID = 0x08,
  CONNECTION_POINT = 0x0C,
  ATTRIBUTE_ID = 0x10,
  SPECIAL = 0x14,
  SERVICE_ID = 0x18,
  EXTENDED_LOGICAL = 0x1C
}

// Logical Segment Format Bits
export enum LogicalSegmentFormat {
  EIGHT_BIT = 0x00,
  SIXTEEN_BIT = 0x01,
  THIRTY_TWO_BIT = 0x02,
  RESERVED = 0x03
}

// Network Segment Types
export enum NetworkSegmentType {
  SCHEDULE = 0x01,
  FIXED_TAG = 0x02,
  PRODUCTION_INHIBIT_TIME = 0x03,
  SAFETY = 0x04,
  PRODUCTION_TRIGGER = 0x05,
  EXTENDED_NETWORK = 0x0F
}

// Symbolic Segment Format
export enum SymbolicSegmentFormat {
  EXTENDED_SYMBOL_SEGMENT = 0x00,
  DOUBLE_CHAR_ASCII = 0x20,
  TRIPLE_CHAR_ASCII = 0x40,
  NUMERIC_SYMBOL = 0x60
}

// Data Segment Type
export enum DataSegmentType {
  SIMPLE_DATA = 0x00,
  ANSI_EXTENDED_SYMBOL = 0x11
}

export const CONNECTION_MANAGER_PATH = Buffer.from([
  SegmentType.CLASS_ID, ObjectClass.CONNECTION_MANAGER,
  SegmentType.INSTANCE_ID, InstanceID.CONNECTION_MANAGER
]);

export interface ComplexDataType {
  type: 'struct' | 'array';
  members?: { [key: string]: 'BOOL' | 'INT' | 'DINT' | 'REAL' | ComplexDataType };
  elementType?: 'BOOL' | 'INT' | 'DINT' | 'REAL' | ComplexDataType;
  length?: number;
}

export const Types = {
  BOOL: 0xc1,
  SINT: 0xc2,
  INT: 0xc3,
  DINT: 0xc4,
  LINT: 0xc5,
  USINT: 0xc6,
  UINT: 0xc7,
  UDINT: 0xc8,
  REAL: 0xca,
  LREAL: 0xcb,
  STIME: 0xcc,
  DATE: 0xcd,
  TIME_AND_DAY: 0xce,
  DATE_AND_STRING: 0xcf,
  STRING: 0xd0,
  WORD: 0xd1,
  DWORD: 0xd2,
  BIT_STRING: 0xd3,
  LWORD: 0xd4,
  STRING2: 0xd5,
  FTIME: 0xd6,
  LTIME: 0xd7,
  ITIME: 0xd8,
  STRINGN: 0xd9,
  SHORT_STRING: 0xda,
  TIME: 0xdb,
  EPATH: 0xdc,
  ENGUNIT: 0xdd,
  STRINGI: 0xde,
  STRUCT: 0xa002
};

export const DEFAULT_PRIORITY_TIME_TICK = 0xEA06;
export const CONNECTION_TIMEOUT_MULTIPLIER = 0x00;
export const CONNECTION_ADDRESS_ITEM = 0xA1;
export const NULL_ADDRESS_ITEM = 0x00;
export const CONNECTION_DATA_ITEM = 0xB1;
export const UNCONNECTED_DATA_ITEM = 0xB2;
export const HEADER_FORMAT_32BIT = 0x02;
export const CONNECTION_PATH_SIZE = 5;  // in 16-bit words
