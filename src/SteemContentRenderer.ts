import ow from "ow";

export class SteemContentRenderer {
    private options: SteemContentRenderer.Options;

    public constructor(options: SteemContentRenderer.Options) {
        SteemContentRenderer.Options.validate(options);
        this.options = options;
    }

    public render(input: string): string {
        return input + this.options.baseUrl;
    }
}

export namespace SteemContentRenderer {
    export interface Options {
        baseUrl: string;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.baseUrl, "Options.baseUrl", ow.string.nonEmpty);
        }
    }
}
