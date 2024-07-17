import net from 'net';
import { OmronPLCBase, PendingRequest } from './OmronPLCBase';
import * as omronConfig from './omronConfig';
import { OmronTcpError } from './OmronTcpError';

export class OmronPLCTCP extends OmronPLCBase {
    private client: net.Socket;
    private clientNode: number | null = null;
    private serverNode: number | null = null;
    private isConnected: boolean = false;
    private isConnecting: boolean = false;
    private buffer: Buffer = Buffer.alloc(0);
    private queue: Array<() => void> = [];
    private processing = true;

    async enqueue(action: () => Promise<void>) {
        if (!this.isConnected) {
            throw new Error('Not connected to PLC');
        }

        return new Promise<void>((resolve) => {
            this.queue.push(async () => {
                await action();
                resolve();
            });
            // Avvia la processazione solo se non è già in corso
            if ((!this.processing) || (!this.firstConnectionPacket())) {
                this.process();
            }
        });
    }

    private async process() {
        if (this.processing) return;
        this.processing = true;
        while (this.queue.length > 0) {
            const action = this.queue.shift();
            if (action) {
                await action();
            }
        }
        this.processing = false;
        // Verifica se sono state aggiunte nuove azioni mentre si processava la coda
        if (this.queue.length > 0) {
            this.process();
        }
    }


    constructor(host: string = omronConfig.DEFAULT_NETWORK_CONFIG.HOST,
        port: number = omronConfig.DEFAULT_NETWORK_CONFIG.TCP_PORT,
        plcNode: number = omronConfig.DEFAULT_NETWORK_CONFIG.PLC_NODE_NUMBER,
        pcNode: number = omronConfig.DEFAULT_NETWORK_CONFIG.NODE_NUMBER) {
        super(host, port, plcNode, pcNode);
        this.client = new net.Socket();
        this.client.setTimeout(omronConfig.DEFAULT_TIMEOUT * 2)
        this.client.setNoDelay(true);
        this.client.on('connect', () => {
            this.isConnected = true;
            this.isConnecting = false;
        });

        this.client.on('data', this.handleData.bind(this));

        this.client.on('error', (err) => {
            console.error('Socket error:', err);
            this.isConnected = false;
            this.isConnecting = false;
            this.clientNode = null;
            this.serverNode = null;
        });

        this.client.on('close', () => {
            this.isConnected = false;
            this.isConnecting = false;
            console.log('Connection closed');
        });
    }

    private firstConnectionPacket(): boolean {
        return (this.clientNode === null) || (this.serverNode === null);
    }

    private async ensureConnected(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        if (this.isConnecting) {
            // Wait for the existing connection attempt to complete
            await new Promise<void>((resolve) => {
                const checkConnection = () => {
                    if (this.isConnected || !this.isConnecting) {
                        resolve();
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
            });
            if (this.isConnected) {
                return;
            }
        }

        this.isConnecting = true;
        return new Promise<void>((resolve, reject) => {
            this.client.connect(this.port, this.host, () => {
                this.isConnected = true;
                this.isConnecting = false;
                if (this.firstConnectionPacket())
                    this.sendConnectionMessage();
                resolve();
            });

            this.client.once('error', (err) => {
                this.isConnecting = false;
                reject(err);
            });
        });
    }

    public close(): void {
        if (this.isConnected || this.isConnecting) {
            this.client.destroy();
            this.isConnected = false;
            this.isConnecting = false;
        }
    }

    private handleConnectionData(data: Buffer) {
        if (this.firstConnectionPacket()) {
            // Verifica se è la risposta al messaggio di connessione
            if (data.length >= 20 && data.readUInt32BE(0) === 0x46494E53) { // "FINS" in ASCII
                const length = data.readUInt32BE(4);
                const command = data.readUInt32BE(8);
                const errorCode = data.readUInt32BE(12);
                if (errorCode !== 0x00000000)
                    throw new OmronTcpError(errorCode);
                if (command === 0x00000001 && errorCode === 0x00000000) {
                    this.clientNode = data.readUInt32BE(16);
                    this.serverNode = data.readUInt32BE(20);
                    this.baseHeader[omronConfig.FINS_HEADER_FIELDS.SA1] = this.clientNode;
                    this.baseHeader[omronConfig.FINS_HEADER_FIELDS.DA1] = this.serverNode;
                    console.log(`Client Node: ${this.clientNode}, Server Node: ${this.serverNode}`);
                    // ripristina la coda delle richieste
                    //this.client.end();
                    this.buffer = Buffer.alloc(0);
                    this.processing = false;
                    this.process();
                }
            }
        }
    }


    private handleData(chunk: Buffer): void {
        if (this.firstConnectionPacket()) {
            this.handleConnectionData(chunk);
            return;
        }
        this.buffer = Buffer.concat([this.buffer, chunk]);
        if (this.buffer.length < 8) {
            return;
        }
        if (this.buffer.readUInt32BE(0) !== 0x46494E53) {
            this.buffer = Buffer.alloc(0);
            return;
        }

        const length = this.buffer.readUInt32BE(4);
        const totalLength = length + 8;  // Lunghezza FINS + header FINS/TCP

        if (this.buffer.length < totalLength) {
            // Non abbiamo ancora ricevuto l'intero pacchetto
            return;
        }
        else {
            if (this.buffer.length < 25) {
                const errorCode = this.buffer.readUInt32BE(12);
                if (errorCode !== 0x00000000)
                    throw new OmronTcpError(errorCode);
            }
            else {
                const sid = this.buffer[25];  // SID si trova a questo offset nell'header FINS
                const pendingRequest = this.requestMap.get(sid);

                if (pendingRequest) {
                    // Copia il contenuto di this.buffer in pendingRequest.buffer
                    pendingRequest.buffer = Buffer.from(this.buffer);

                    // Reimposta this.buffer a un nuovo buffer vuoto
                    this.handleCompleteResponse(sid, pendingRequest);
                } else {
                    console.warn(`Received response for unknown SID: ${sid}`);
                    //this.buffer = Buffer.alloc(0);
                }
            }
            this.buffer = Buffer.alloc(0);
        }
    }
    private sendConnectionMessage() {
        const tcpHeader = Buffer.alloc(20);
        tcpHeader.writeUInt32BE(0x46494E53, 0);  // "FINS" in ASCII
        tcpHeader.writeUInt32BE(0x0000000C, 4);  // Length
        tcpHeader.writeUInt32BE(0x00000000, 8);  // Command
        tcpHeader.writeUInt32BE(0x00000000, 12);  // Error Code
        tcpHeader.writeUInt32BE(0x00000000, 16);  // Aggiungi nodo client (0=auto)
        // ferma le altre richieste
        this.processing = true;
        this.client.write(tcpHeader);
    }

    protected removeHeader(msg: Buffer): Buffer {
        return msg.subarray(16);
    }

    public async sendCommand(command: number[], params: Buffer, data?: Buffer): Promise<Buffer> {
        await this.ensureConnected();

        return new Promise<Buffer>((resolve, reject) => {
            const sendPacket = async () => {
                try {
                    await this.ensureConnected();

                    if (this.firstConnectionPacket()) {
                        reject(new Error('Not connected to PLC. Client or Server Node not set.'));
                    }

                    const sid = this.generateSID();
                    const header = Buffer.from(this.baseHeader);
                    header[9] = sid;

                    // Costruisci il pacchetto FINS
                    let finsPacket = Buffer.concat([
                        header,
                        Buffer.from(command),
                        params
                    ]);
                    if (data) {
                        finsPacket = Buffer.concat([finsPacket, data]);
                    }

                    // Costruisci l'header FINS/TCP
                    const tcpHeader = Buffer.alloc(16);
                    tcpHeader.writeUInt32BE(0x46494E53, 0);  // "FINS" in ASCII
                    tcpHeader.writeUInt32BE(finsPacket.length + 8, 4); // Length
                    tcpHeader.writeUInt32BE(0x00000002, 8);   // Command
                    tcpHeader.writeUInt32BE(0x00000000, 12);  // Error Code

                    // Combina l'header TCP e il pacchetto FINS
                    const packet = Buffer.concat([tcpHeader, finsPacket]);
                    //this.client.write(tcpHeader);
                    //await new Promise(r => setTimeout(r, 30));

                    const timeoutId = setTimeout(() => {
                        this.requestMap.delete(sid);
                        this.timeOut();
                        reject(new Error('Request timed out'));
                    }, omronConfig.DEFAULT_TIMEOUT);

                    this.requestMap.set(sid, {
                        resolve,
                        reject,
                        timeoutId,
                        startTime: performance.now(),
                        dataSent: packet.length,
                        realByteSent: data ? data.length : 0,
                        buffer: Buffer.alloc(0)  // Buffer iniziale vuoto per questa richiesta
                    });
                    //console.log(finsPacket);
                    this.client.write(packet, (err) => {
                        if (err) {
                            clearTimeout(timeoutId);
                            this.requestMap.delete(sid);
                            reject(err);
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            };

            this.enqueue(sendPacket);
        });
    }
}
