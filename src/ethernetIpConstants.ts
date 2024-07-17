// CIP Common Services
export const CIP_COMMON_SERVICES = {
    GET_ATTRIBUTE_ALL: 0x01,
    SET_ATTRIBUTE_ALL: 0x02,
    GET_ATTRIBUTE_LIST: 0x03,
    SET_ATTRIBUTE_LIST: 0x04,
    RESET: 0x05,
    START: 0x06,
    STOP: 0x07,
    CREATE: 0x08,
    DELETE: 0x09,
    MULTIPLE_SERVICE_PACKET: 0x0A,
    APPLY_ATTRIBUTES: 0x0D,
    GET_ATTRIBUTE_SINGLE: 0x0E,
    SET_ATTRIBUTE_SINGLE: 0x10,
    READ_DATA: 0x4C
  };
  
  // EtherNet/IP Encapsulation Commands
  export const ENCAPSULATION_COMMANDS = {
    NOP: 0x0000,
    LIST_SERVICES: 0x0004,
    LIST_IDENTITY: 0x0063,
    LIST_INTERFACES: 0x0064,
    REGISTER_SESSION: 0x0065,
    UNREGISTER_SESSION: 0x0066,
    SEND_RR_DATA: 0x006F,
    SEND_UNIT_DATA: 0x0070,
  };
  
  // CIP Object Class Codes
  export const CIP_OBJECT_CLASSES = {
    IDENTITY: 0x01,
    MESSAGE_ROUTER: 0x02,
    ASSEMBLY: 0x04,
    CONNECTION_MANAGER: 0x06,
    TCP_IP_INTERFACE: 0xF5,
    ETHERNET_LINK: 0xF6,
  };
  
  // EtherNet/IP Ports
  export const ETHERNET_IP_PORTS = {
    TCP: 44818,
    UDP: 2222,
  };
  
  // Maximum sizes
  export const MAX_CIP_MSG_SIZE = 65535;
  export const MAX_ETHERNET_PACKET_SIZE = 1518;
  
  // Default timeouts (in milliseconds)
  export const DEFAULT_SESSION_TIMEOUT = 10000;
  export const DEFAULT_FORWARD_OPEN_TIMEOUT = 5000;
  
  // Connection parameters
  export const CONNECTION_PARAMETERS = {
    T_TO_O_RPI: 5000000, // 5ms in microseconds
    O_TO_T_RPI: 5000000, // 5ms in microseconds
    T_TO_O_SIZE: 32,
    O_TO_T_SIZE: 32,
    TRANSPORT_CLASS: 3,
  };