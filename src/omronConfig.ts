// Costanti per i campi dell'header FINS
export const FINS_HEADER_FIELDS = {
  ICF: 0,
  RSV: 1,
  GCT: 2,
  DNA: 3,
  DA1: 4,
  DA2: 5,
  SNA: 6,
  SA1: 7,
  SA2: 8,
  SID: 9
};

// Valori predefiniti per l'header FINS
export const DEFAULT_FINS_HEADER = [
  0x80, // ICF
  0x00, // RSV
  0x02, // GCT
  0x00, // DNA
  0x00, // DA1
  0x00, // DA2
  0x00, // SNA
  0x00, // SA1
  0x00, // SA2
  0x00  // SID
];


export const FINS_COMMANDS = {
  MEMORY_AREA_READ: [0x01, 0x01], // Lettura area di memoria
  MEMORY_AREA_WRITE: [0x01, 0x02], // Scrittura area di memoria
  MEMORY_AREA_FILL: [0x01, 0x03], // Riempimento area di memoria
  MULTIPLE_MEMORY_AREA_READ: [0x01, 0x04], // Lettura multipla area di memoria
  MEMORY_AREA_TRANSFER: [0x01, 0x05], // Trasferimento area di memoria
  PARAMETER_AREA_READ: [0x02, 0x01], // Lettura area parametri
  PARAMETER_AREA_WRITE: [0x02, 0x02], // Scrittura area parametri
  PARAMETER_AREA_CLEAR: [0x02, 0x03], // Cancellazione area parametri
  PROGRAM_AREA_PROTECT: [0x03, 0x01], // Protezione area programma
  PROGRAM_AREA_PROTECT_CLEAR: [0x03, 0x02], // Rimozione protezione area programma
  PROGRAM_AREA_READ: [0x04, 0x01], // Lettura area programma
  PROGRAM_AREA_WRITE: [0x04, 0x02], // Scrittura area programma
  PROGRAM_AREA_CLEAR: [0x04, 0x03], // Cancellazione area programma
  RUN: [0x08, 0x01], // Avvio
  STOP: [0x08, 0x02], // Arresto
  CONTROLLER_DATA_READ: [0x09, 0x01], // Lettura dati del controller
  CONNECTION_DATA_READ: [0x0A, 0x01], // Lettura dati di connessione
  CONTROLLER_STATUS_READ: [0x0B, 0x01], // Lettura stato del controller
  CYCLE_TIME_READ: [0x0C, 0x01], // Lettura tempo di ciclo
  CLOCK_READ: [0x0D, 0x01], // Lettura orologio
  CLOCK_WRITE: [0x0D, 0x02], // Scrittura orologio
  MESSAGE_READ: [0x0E, 0x01], // Lettura messaggio
  MESSAGE_CLEAR: [0x0E, 0x02], // Cancellazione messaggio
  FAL_FALS_READ: [0x0F, 0x01], // Lettura FAL/FALS
  ACCESS_RIGHT_ACQUIRE: [0x10, 0x01], // Acquisizione diritti di accesso
  ACCESS_RIGHT_FORCED_ACQUIRE: [0x10, 0x02], // Acquisizione forzata diritti di accesso
  ACCESS_RIGHT_RELEASE: [0x10, 0x03], // Rilascio diritti di accesso
  ERROR_CLEAR: [0x11, 0x01], // Cancellazione errore
  ERROR_LOG_READ: [0x12, 0x01], // Lettura log errori
  ERROR_LOG_CLEAR: [0x12, 0x02], // Cancellazione log errori
  FILE_NAME_READ: [0x13, 0x01], // Lettura nome file
  SINGLE_FILE_READ: [0x14, 0x01], // Lettura file singolo
  SINGLE_FILE_WRITE: [0x14, 0x02], // Scrittura file singolo
  MEMORY_CARD_FORMAT: [0x15, 0x01], // Formattazione scheda di memoria
  FILE_DELETE: [0x15, 0x02], // Cancellazione file
  VOLUME_LABEL_CREATE_DELETE: [0x16, 0x01], // Creazione/cancellazione etichetta volume
  FILE_COPY: [0x17, 0x01], // Copia file
  FILE_NAME_CHANGE: [0x18, 0x01], // Cambio nome file
  FILE_DATA_CHECK: [0x19, 0x01], // Controllo dati file
  MEMORY_AREA_FILE_TRANSFER: [0x1A, 0x01], // Trasferimento file area di memoria
  PARAMETER_AREA_FILE_TRANSFER: [0x1B, 0x01], // Trasferimento file area parametri
  PROGRAM_AREA_FILE_TRANSFER: [0x1C, 0x01], // Trasferimento file area programma
  FORCED_SET_RESET: [0x1D, 0x01], // Impostazione/reset forzato
  FORCED_SET_RESET_CANCEL: [0x1D, 0x02], // Annullamento impostazione/reset forzato
  ABORTING_COMMANDS: [0x1E, 0x01] // Comandi di annullamento
};

export const FINS_RESPONSES = {
  NORMAL_COMPLETION: [0x00, 0x00], // Completamento normale
  SERVICE_INTERRUPTION: [0x01, 0x00], // Interruzione del servizio
  NODE_BUSY: [0x01, 0x01], // Nodo occupato
  TIMEOUT_ERROR: [0x02, 0x00], // Errore di timeout
  SERVICE_STOP: [0x03, 0x00], // Arresto del servizio
  DESTINATION_NODE_ERROR: [0x04, 0x00], // Errore nodo di destinazione
  CONTROLLER_ERROR: [0x05, 0x00], // Errore del controller
  COMMAND_ERROR: [0x06, 0x00], // Errore di comando
  DATA_ERROR: [0x07, 0x00] // Errore di dati
};

export const MEMORY_AREAS = {
  CV: [
    { name: "CIO", memoryAreaCode: 0xB0, nByte: 2, maxAddress: 6143 },
    { name: "WR", memoryAreaCode: 0xB1, nByte: 2, maxAddress: 511 },
    { name: "HR", memoryAreaCode: 0xB2, nByte: 2, maxAddress: 511 },
    { name: "HR_BIT", memoryAreaCode: 0xB2, nByte: 1, maxAddress: 511 },
    { name: "AR", memoryAreaCode: 0xB3, nByte: 2, maxAddress: 959 },
    { name: "TIMER", memoryAreaCode: 0x89, nByte: 2, maxAddress: 2047 },
    { name: "COUNTER", memoryAreaCode: 0x89, nByte: 2, maxAddress: 2047 },
    { name: "DM", memoryAreaCode: 0x82, nByte: 2, maxAddress: 24575 },
    { name: "DM_BIT", memoryAreaCode: 0x02, nByte: 1, maxAddress: 24575 },
    { name: "TRANSITION", memoryAreaCode: 0x83, nByte: 1, maxAddress: 511 },
    { name: "STEP", memoryAreaCode: 0x84, nByte: 2, maxAddress: 511 },
    { name: "ACTION", memoryAreaCode: 0x8B, nByte: 1, maxAddress: 1023 },
    { name: "IR", memoryAreaCode: 0x8C, nByte: 2, maxAddress: 15 },
    { name: "DR", memoryAreaCode: 0x8C, nByte: 2, maxAddress: 15 },
    { name: "EM", memoryAreaCode: 0x90, nByte: 2, maxAddress: 24575 }
  ],
  C: [
    { name: "CIO", memoryAreaCode: 0x30, nByte: 2, maxAddress: 255 },
    { name: "WR", memoryAreaCode: 0x31, nByte: 2, maxAddress: 63 },
    { name: "HR", memoryAreaCode: 0x32, nByte: 2, maxAddress: 99 },
    { name: "HR_BIT", memoryAreaCode: 0x32, nByte: 1, maxAddress: 99 },
    { name: "AR", memoryAreaCode: 0x33, nByte: 2, maxAddress: 27 },
    { name: "TIMER", memoryAreaCode: 0x89, nByte: 2, maxAddress: 511 },
    { name: "COUNTER", memoryAreaCode: 0x89, nByte: 2, maxAddress: 511 },
    { name: "DM", memoryAreaCode: 0x82, nByte: 2, maxAddress: 9999 },
    { name: "DM_BIT", memoryAreaCode: 0x02, nByte: 1, maxAddress: 9999 },
    { name: "EM", memoryAreaCode: 0x92, nByte: 2, maxAddress: 24575 }
  ]
};

// Configurazione di rete predefinita
export const DEFAULT_NETWORK_CONFIG = {
  HOST: '192.168.250.1',  // Indirizzo IP del PLC
  PORT: 9600,            // Porta di default per FINS/UDP
  TCP_PORT: 9600,        // Porta di default per FINS/TCP
  NODE_NUMBER: 10,        // Numero del nodo locale
  PLC_NODE_NUMBER: 1     // Numero del nodo del PLC
};

// Timeout predefinito per le richieste (in millisecondi)
export const DEFAULT_TIMEOUT = 10000;
