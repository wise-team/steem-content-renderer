import { CustomError } from "universe-log";

export class RendererError extends CustomError {
    public constructor(message?: string, cause?: Error) {
        super(message, cause);
    }
}
