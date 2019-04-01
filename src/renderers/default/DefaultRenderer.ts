import ow from "ow";
import * as Remarkable from "remarkable";

import { SecurityChecker } from "../../security/SecurityChecker";

import { AssetEmbedder } from "./embedder/AssetEmbedder";
import { Sanitizer } from "./sanitization/Sanitizer";

export class DefaultRenderer {
    private options: DefaultRenderer.Options;
    private sanitizer: Sanitizer;

    public constructor(options: DefaultRenderer.Options) {
        DefaultRenderer.Options.validate(options);
        this.options = options;

        this.sanitizer = new Sanitizer();
    }

    public render(input: string): string {
        ow(input, "input", ow.string.nonEmpty);
        return this.doRender(input);
    }

    private doRender(text: string): string {
        const isHtml = Sanitizer.isHtml(text);
        text = this.preSanitize(text);
        text = isHtml ? text : this.renderMarkdown(text);
        text = this.wrapRenderedTextWithHtmlIfNeeded(text);
        text = this.options.embedder.markAssets(text);
        text = this.sanitize(text);
        SecurityChecker.checkSecurity(text);
        text = this.options.embedder.insertAssets(text);

        return text;
    }

    private preSanitize(text: string): string {
        return this.sanitizer.preliminarySanitize(text);
    }

    private renderMarkdown(text: string): string {
        const renderer = new Remarkable({
            html: true, // remarkable renders first then sanitize runs...
            breaks: this.options.breaks,
            linkify: false, // linkify is done locally
            typographer: false, // https://github.com/jonschlinkert/remarkable/issues/142#issuecomment-221546793
            quotes: "“”‘’",
        });
        return renderer.render(text);
    }

    private wrapRenderedTextWithHtmlIfNeeded(renderedText: string): string {
        // If content isn't wrapped with an html element at this point, add it.
        if (renderedText.indexOf("<html>") !== 0) {
            renderedText = "<html>" + renderedText + "</html>";
        }
        return renderedText;
    }

    private sanitize(text: string): string {
        if (this.options.skipSanitization) {
            return text;
        }

        return this.sanitizer.sanitize(text);
    }
}

export namespace DefaultRenderer {
    export interface Options {
        breaks: boolean;
        skipSanitization: boolean;
        embedder: AssetEmbedder;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.breaks, "Options.breaks", ow.boolean);
            ow(o.skipSanitization, "Options.skipSanitization", ow.boolean);
            ow(o.embedder, "embedder", ow.object);
        }
    }
}
