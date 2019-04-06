import { DefaultRendererLocalization } from "../DefaultRendererLocalization";

import { AssetEmbedderOptions } from "./AssetEmbedderOptions";
import { HtmlDOMParser } from "./HtmlDOMParser";
import { VideoEmbedders } from "./videoembedders/VideoEmbedders";

export class AssetEmbedder {
    private options: AssetEmbedderOptions;
    private localization: DefaultRendererLocalization;

    public constructor(options: AssetEmbedderOptions, localization: DefaultRendererLocalization) {
        AssetEmbedderOptions.validate(options);
        this.options = options;
        this.localization = localization;
    }

    public markAssets(input: string): string {
        const parser = new HtmlDOMParser(this.options, this.localization);
        return parser.parse(input).getParsedDocumentAsString();
    }

    public insertAssets(input: string): string {
        const size = {
            width: this.options.width,
            height: this.options.height,
        };
        return VideoEmbedders.insertMarkedEmbedsToRenderedOutput(input, size);
    }
}
