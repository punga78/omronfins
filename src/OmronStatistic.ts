// Definizione della classe OmronStatistic
export class OmronStatistic {
    private totalByteSent: number;
    private totalByteReceived: number;
    private totalOverHeadSent: number;
    private totalOverHeadReceived: number;
    private totalTime: number;
    private count: number;
    private totalRealByteSent: number;
    private totalRealByteReceived: number;
    private totalPacketLost: number;

    constructor() {
        this.totalByteSent = 0; // Inizializziamo i byte inviati a 0
        this.totalByteReceived = 0; // Inizializziamo i byte ricevuti a 0
        this.totalOverHeadSent = 0; // Inizializziamo l'overhead inviato a 0
        this.totalOverHeadReceived = 0; // Inizializziamo l'overhead ricevuto a 0
        this.totalTime = 0; // Inizializziamo il tempo totale a 0
        this.count = 0; // Inizializziamo il contatore degli aggiornamenti a 0
        this.totalRealByteSent = 0; // Inizializziamo i byte reali inviati a 0
        this.totalRealByteReceived = 0; // Inizializziamo i byte reali ricevuti a 0
        this.totalPacketLost = 0;
    }
    public addPacketLost()
    {
        this.totalPacketLost += 1;
    }

    // Metodo per aggiornare le statistiche
    public updateStatistics(realDataSent: number, startTime: number, realDataReceived: number, totalDataSent: number, totalDataReceived: number): void {
        const endTime = performance.now();
        this.totalRealByteSent += realDataSent;
        this.totalRealByteReceived += realDataReceived;
        this.totalByteSent += totalDataSent;
        this.totalByteReceived += totalDataReceived;
        this.totalOverHeadSent += (totalDataSent - realDataSent);
        this.totalOverHeadReceived += (totalDataReceived - realDataReceived);
        this.totalTime += (endTime - startTime); // Convertiamo il tempo da millisecondi a secondi
        this.count += 1; // Incrementiamo il contatore degli aggiornamenti
    }

    // Metodo per ottenere le statistiche
    public getStatistics(): { 
        totalTime: number, 
        
        totalPacketLost : number, 
        totalPacketOK : number, 
        
        totalByteSent: number, 
        totalByteReceived: number, 
        totalOverHeadSent: number, 
        totalOverHeadReceived: number, 
        totalRealByteSent: number,
        totalRealByteReceived: number,

        bytesSentPerSecond: number,
        bytesReceivedPerSecond: number,
        realBytesSentPerSecond: number,
        realBytesReceivedPerSecond: number

        averageByteSent: number, 
        averageByteReceived: number, 
        averageOverHeadSent: number,
        averageOverHeadReceived: number,
        averageRealByteSent: number,
        averageRealByteReceived: number,
    } {
        const averageByteSent = this.totalByteSent / this.count;
        const averageByteReceived = this.totalByteReceived / this.count;
        const averageOverHeadSent = this.totalOverHeadSent / this.count;
        const averageOverHeadReceived = this.totalOverHeadReceived / this.count;
        const bytesSentPerSecond = this.totalByteSent / (this.totalTime / 1000);
        const bytesReceivedPerSecond = this.totalByteReceived / (this.totalTime / 1000);
        const averageRealByteSent = this.totalRealByteSent / this.count;
        const averageRealByteReceived = this.totalRealByteReceived / this.count;
        const realBytesSentPerSecond = this.totalRealByteSent / (this.totalTime / 1000);
        const realBytesReceivedPerSecond = this.totalRealByteReceived / (this.totalTime / 1000);

        return {
            totalTime: this.totalTime / 1000,
            totalPacketLost: this.totalPacketLost,
            totalPacketOK: this.count * 2,
            totalByteSent: this.totalByteSent,
            totalOverHeadSent: this.totalOverHeadSent,
            totalByteReceived: this.totalByteReceived,
            totalOverHeadReceived: this.totalOverHeadReceived,
            totalRealByteSent: this.totalRealByteSent,
            totalRealByteReceived: this.totalRealByteReceived,

            bytesSentPerSecond: bytesSentPerSecond,
            bytesReceivedPerSecond: bytesReceivedPerSecond,
            realBytesSentPerSecond: realBytesSentPerSecond,
            realBytesReceivedPerSecond: realBytesReceivedPerSecond,

            averageByteSent: averageByteSent,
            averageByteReceived: averageByteReceived,
            averageOverHeadSent: averageOverHeadSent,
            averageOverHeadReceived: averageOverHeadReceived,
            averageRealByteSent: averageRealByteSent,
            averageRealByteReceived: averageRealByteReceived,
        };
    }
}

// Esempio di utilizzo della classe OmronStatistic
/* 
const stats = new OmronStatistic();

// Simuliamo l'aggiornamento delle statistiche
const startTime = performance.now();
const realDataSent = 1024;
const realDataReceived = 2048;
const totalDataSent = 1054; // Comprensivo di overhead
const totalDataReceived = 2098; // Comprensivo di overhead

stats.updateStatistics(realDataSent, startTime, realDataReceived, totalDataSent, totalDataReceived);

// Otteniamo le statistiche aggiornate
console.log(stats.getStatistics());
 */