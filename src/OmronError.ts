export class OmronError extends Error {
    public mainCode: number;
    public subCode: number;
    public description: string;
  
    constructor(mainCode: number, subCode: number) {
      const description = OmronError.getErrorDescription(mainCode, subCode);
      super(`Omron FINS Error: ${description} (Main: 0x${mainCode.toString(16)}, Sub: 0x${subCode.toString(16)})`);
  
      this.name = 'OmronError';
      this.mainCode = mainCode;
      this.subCode = subCode;
      this.description = description;
  
      // Necessario per far funzionare correttamente instanceof in TypeScript
      Object.setPrototypeOf(this, OmronError.prototype);
    }
  
    static getErrorDescription(mainCode: number, subCode: number): string {
      const errorCodes: { [key: string]: string } = {
        '0000': 'Normal completion',
        '0101': 'Local Error: Local node not in network.',
        '0102': 'Local Error: Token timeout',
        '0103': 'Local Error: Retries failed',
        '0104': 'Local Error: Too many send frames',
        '0105': 'Local Error: Node address setting error',
        '0106': 'Local Error: Node address duplication',
        '0201': 'Destination node not in network',
        '0202': 'Unit missing',
        '0203': 'Third node missing',
        '0204': 'Destination node busy',
        '0205': 'Response timeout',
        '0301': 'Communications controller error',
        '0302': 'CPU unit error',
        '0303': 'Controller error',
        '0304': 'Unit number error',
        '0401': 'Undefined command',
        '0402': 'Not supported by model/version',
        '0501': 'Destination address setting error',
        '0502': 'No routing tables',
        '0503': 'Routing table error',
        '0504': 'Too many relays',
        '1001': 'Command too long',
        '1002': 'Command too short',
        '1003': 'Elements/data don\'t match',
        '1004': 'Command format error',
        '1005': 'Header error',
        '1101': 'Area classification missing',
        '1102': 'Access size error',
        '1103': 'Address range error',
        '1104': 'Address range exceeded',
        '1106': 'Program missing',
        '1109': 'Relational error',
        '110A': 'Duplicate data access',
        '110B': 'Response too long',
        '110C': 'Parameter error',
        '2002': 'Protected',
        '2003': 'Table missing',
        '2004': 'Data missing',
        '2005': 'Program missing',
        '2006': 'File missing',
        '2007': 'Data mismatch',
        '2101': 'Read-only area',
        '2102': 'Protected',
        '2103': 'Cannot register',
        '2105': 'Program missing',
        '2106': 'File missing',
        '2107': 'File name already exists',
        '2108': 'Cannot change',
        '2201': 'Not possible during execution',
        '2202': 'Not possible while running',
        '2203': 'Wrong PLC mode',
        '2204': 'Wrong PLC mode',
        '2205': 'Wrong PLC mode',
        '2206': 'Wrong PLC mode',
        '2207': 'Specified node not polling node',
        '2208': 'Step cannot be executed',
        '2301': 'File device missing',
        '2302': 'Memory missing',
        '2303': 'Clock missing',
        '2401': 'Table missing',
        '2502': 'Memory error',
        '2503': 'I/O setting error',
        '2504': 'Too many I/O points',
        '2505': 'CPU bus error',
        '2506': 'I/O duplication',
        '2507': 'I/O bus error',
        '2509': 'SYSMAC BUS/2 error',
        '250A': 'CPU bus unit error',
        '250D': 'SYSMAC BUS No. duplication',
        '250F': 'Memory error',
        '2510': 'SYSMAC BUS terminator missing',
        '2601': 'No protection',
        '2602': 'Incorrect password',
        '2604': 'Protected',
        '2605': 'Service already executing',
        '2606': 'Service stopped',
        '2607': 'No execution right',
        '2608': 'Settings not complete',
        '2609': 'Necessary items not set',
        '260A': 'Number already defined',
        '260B': 'Error will not clear',
        '3001': 'Access right error',
        '4001': 'Service aborted'
      };
  
      const errorKey = `${mainCode.toString(16).padStart(2, '0')}${subCode.toString(16).padStart(2, '0')}`.toUpperCase();
      return errorCodes[errorKey] || 'Unknown error';
    }
  }