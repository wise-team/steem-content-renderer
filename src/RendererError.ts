import ChainedError from "typescript-chained-error";

export class RendererError extends ChainedError {
    public constructor(message?: string, cause?: Error) {
        super(message, cause);
    }
}
