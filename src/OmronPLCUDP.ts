// OmronPLCUDP.ts
import dgram from 'dgram';
import * as omronConfig from './omronConfig';
import { OmronConfig, OmronPLCBase } from './OmronPLCBase';

export class OmronPLCUDP extends OmronPLCBase {
    private client: dgram.Socket;
    private isSocketBound: boolean = false;

    constructor(config: OmronConfig = {}) {
        super(config);
        this.client = dgram.createSocket('udp4');
        this.client.on('message', this.handleResponse.bind(this));
        this.client.on('error', this.handleError.bind(this));
    }

    private async ensureSocketBound(): Promise<void> {
        if (!this.isSocketBound) {
            return new Promise((resolve, reject) => {
                this.client.bind(0, () => {
                    this.isSocketBound = true;
                    resolve();//
                });
            });
        }
    }

    private handleResponse(msg: Buffer): void {
        const sid = msg[9];
        const request = this.requestMap.get(sid);
        if (request) {
            request.buffer = Buffer.from(msg);
            this.handleCompleteResponse(sid, request);
        } else {
            console.warn(`Received response for unknown SID: ${sid}`);
        }
    }

    private handleError(err: Error): void {
        console.error('Socket error:', err);
    }

    protected async sendCommand(command: number[], params: Buffer, data?: Buffer): Promise<Buffer> {
        await this.ensureSocketBound();

        return new Promise((resolve, reject) => {
            const sid = this.generateSID();
            const header = Buffer.from(this.baseHeader);
            header[omronConfig.FINS_HEADER_FIELDS.SID] = sid;

            let packet = Buffer.concat([header, Buffer.from(command), params]);
            if (data) {
                packet = Buffer.concat([packet, data]);
            }

            const timeoutId = setTimeout(() => {
                this.requestMap.delete(sid);
                this.timeOut();
                reject(new Error('Request timeout'));
            }, this.timeoutMs);

            this.requestMap.set(sid, {
                resolve,
                reject,
                timeoutId,
                startTime: performance.now(),
                dataSent: packet.length,
                realByteSent: data ? data.length : 0,
                buffer: Buffer.alloc(0)  // Buffer iniziale vuoto per questa richiesta
            });

            //console.log(packet);
            this.client.send(packet, 0, packet.length, this.port, this.host, (err) => {
                if (err) {
                    clearTimeout(timeoutId);
                    this.requestMap.delete(sid);
                    reject(err);
                }
            });
        });
    }

    close(): void {
        this.client.close();
    }
}