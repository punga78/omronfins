export class OmronTcpError extends Error {
    static errorCodes = {
      0: "Normal",
      1: "The header is not 'FINS' (ASCII code).",
      2: "The data length is too long.",
      3: "The command is not supported.",
      20: "All connections are in use.",
      21: "The specified node is already connected.",
      22: "Attempt to access a protected node from an unspecified IP address.",
      23: "The client FINS node address is out of range.",
      24: "The same FINS node address is being used by the client and server.",
      25: "All the node addresses available for allocation have been used"
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