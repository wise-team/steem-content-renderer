import ow from "ow";

export class DefaultRenderer {
    private options: DefaultRenderer.Options;

    public constructor(options: DefaultRenderer.Options) {
        DefaultRenderer.Options.validate(options);
        this.options = options;
    }

    public render(input: string): string {
        return input + this.options.baseUrl;
    }
}

export namespace DefaultRenderer {
    export interface Options {
        baseUrl: string;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.baseUrl, "Options.baseUrl", ow.string.nonEmpty);
        }
    }
}
