import ow from "ow";
import * as Remarkable from "remarkable";

import { SecurityChecker } from "../../security/SecurityChecker";

import { AssetEmbedder } from "./embedder/AssetEmbedder";
import { PreliminarySanitizer } from "./sanitization/PreliminarySanitizer";
import { TagTransformingSanitizer } from "./sanitization/TagTransformingSanitizer";

export class DefaultRenderer {
    private options: DefaultRenderer.Options;
    private tagTransformingSanitizer: TagTransformingSanitizer;

    public constructor(options: DefaultRenderer.Options) {
        DefaultRenderer.Options.validate(options);
        this.options = options;

        this.tagTransformingSanitizer = new TagTransformingSanitizer({
            iframeWidth: this.options.assets.width,
            iframeHeight: this.options.assets.height,
            addNofollowToLinks: this.options.addNofollowToLinks,
            noImage: this.options.doNotShowImages,
            localization: {
                noImageMessage: this.options.localization.no_image_message,
                phishingWarningMessage: this.options.localization.phishy_message,
            },
        });
    }

    public render(input: string): string {
        ow(input, "input", ow.string.nonEmpty);
        return this.doRender(input);
    }

    private doRender(text: string): string {
        text = PreliminarySanitizer.preliminarySanitize(text);

        const isHtml = this.isHtml(text);
        text = isHtml ? text : this.renderMarkdown(text);

        text = this.wrapRenderedTextWithHtmlIfNeeded(text);
        text = this.options.embedder.markAssets(text);
        text = this.sanitize(text);
        SecurityChecker.checkSecurity(text);
        text = this.options.embedder.insertAssets(text);

        return text;
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

    private isHtml(text: string): boolean {
        let html = false;
        // See also ReplyEditor isHtmlTest
        const m = text.match(/^<html>([\S\s]*)<\/html>$/);
        if (m && m.length === 2) {
            html = true;
            text = m[1];
        } else {
            // See also ReplyEditor isHtmlTest
            html = /^<p>[\S\s]*<\/p>/.test(text);
        }
        return html;
    }

    private sanitize(text: string): string {
        if (this.options.skipSanitization) {
            return text;
        }

        return this.tagTransformingSanitizer.sanitize(text);
    }
}

export namespace DefaultRenderer {
    export interface Options {
        breaks: boolean;
        skipSanitization: boolean;
        addNofollowToLinks: boolean;
        doNotShowImages: boolean;
        assets: {
            width: number;
            height: number;
        };
        localization: {
            phishy_message: string; // "Link expanded to plain text; beware of a potential phishing attempt"
            external_link_message: string; // "This link will take you away from example.com"
            no_image_message: string; // "Images not allowed"
        };
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.breaks, "Options.breaks", ow.boolean);
            ow(o.skipSanitization, "Options.skipSanitization", ow.boolean);
            ow(o.addNofollowToLinks, "Options.addNofollowToLinks", ow.boolean);
            ow(o.doNotShowImages, "Options.doNotShowImages", ow.boolean);

            ow(o.assets, "Options.assets", ow.object);
            ow(o.assets.width, "Options.assets.width", ow.number.integer.positive);
            ow(o.assets.height, "Options.assets.height", ow.number.integer.positive);

            ow(o.localization, "Options.localization", ow.object);
            ow(o.localization.phishy_message, "Options.phishy_message", ow.string.nonEmpty);
            ow(o.localization.external_link_message, "Options.external_link_message", ow.string.nonEmpty);
            ow(o.localization.no_image_message, "Options.no_image_message", ow.string.nonEmpty);
        }
    }
}
