export class OmronTcpError extends Error {
    static errorCodes = {
      0x00: "Normal",
      0x01: "The header is not 'FINS' (ASCII code).",
      0x02: "The data length is too long.",
      0x03: "The command is not supported.",
      0x20: "All connections are in use.",
      0x21: "The specified node is already connected.",
      0x22: "Attempt to access a protected node from an unspecified IP address.",
      0x23: "The client FINS node address is out of range.",
      0x24: "The same FINS node address is being used by the client and server.",
      0x25: "All the node addresses available for allocation have been used"
    };
    code: number;
  
    constructor(code :number) {
      const errorMessage = OmronTcpError.errorCodes[code] || "Unknown error";
      super(`Omron TCP Error ${code}: ${errorMessage}`);
      this.name = "OmronTcpError";
      this.code = code;
    }
  }
  
  // Esempio di utilizzo:
  // const error = new OmronTcpError(20);
  // console.log(error.message); // Output: "Omron TCP Error 20: All connections are in use."