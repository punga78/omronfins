import { CIP_ERRORS } from "./ethernetIpConstants";

export class OmronEthernetIpError extends Error {
    errorCode: number;
    description: string;

    constructor(errorCode: number) {
        const errorMessage = CIP_ERRORS[errorCode] || "Unknown error";
        super(`Omron Ethernet/Ip Error ${errorCode}: ${errorMessage}`);
        this.errorCode = errorCode;
        this.description = errorMessage;
    }
}
