import ow from "ow";
import * as Remarkable from "remarkable";

import { SecurityChecker } from "../../security/SecurityChecker";

import { DefaultRendererLocalization } from "./DefaultRendererLocalization";
import { AssetEmbedder } from "./embedder/AssetEmbedder";
import { PreliminarySanitizer } from "./sanitization/PreliminarySanitizer";
import { TagTransformingSanitizer } from "./sanitization/TagTransformingSanitizer";

export class DefaultRenderer {
    private options: DefaultRenderer.Options;
    private tagTransformingSanitizer: TagTransformingSanitizer;
    private embedder: AssetEmbedder;

    public constructor(
        options: DefaultRenderer.Options,
        localization: DefaultRendererLocalization = DefaultRendererLocalization.DEFAULT,
    ) {
        DefaultRenderer.Options.validate(options);
        this.options = options;

        DefaultRendererLocalization.validate(localization);

        this.tagTransformingSanitizer = new TagTransformingSanitizer(
            {
                iframeWidth: this.options.assetsWidth,
                iframeHeight: this.options.assetsHeight,
                addNofollowToLinks: this.options.addNofollowToLinks,
                noImage: this.options.doNotShowImages,
                isLinkSafeFn: this.options.isLinkSafeFn,
            },
            localization,
        );

        this.embedder = new AssetEmbedder(
            {
                ipfsPrefix: this.options.ipfsPrefix,
                width: this.options.assetsWidth,
                height: this.options.assetsHeight,
                hideImages: this.options.doNotShowImages,
                imageProxyFn: this.options.imageProxyFn,
                hashtagUrlFn: this.options.hashtagUrlFn,
                usertagUrlFn: this.options.usertagUrlFn,
                baseUrl: this.options.baseUrl,
            },
            localization,
        );
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
        text = this.embedder.markAssets(text);
        text = this.sanitize(text);
        SecurityChecker.checkSecurity(text, { allowScriptTag: this.options.allowInsecureScriptTags });
        text = this.embedder.insertAssets(text);

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
        baseUrl: string;
        breaks: boolean;
        skipSanitization: boolean;
        allowInsecureScriptTags: boolean;
        addNofollowToLinks: boolean;
        doNotShowImages: boolean;
        ipfsPrefix: string;
        assetsWidth: number;
        assetsHeight: number;
        imageProxyFn: (url: string) => string;
        hashtagUrlFn: (hashtag: string) => string;
        usertagUrlFn: (account: string) => string;
        isLinkSafeFn: (url: string) => boolean;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.baseUrl, "Options.baseUrl", ow.string.nonEmpty);
            ow(o.breaks, "Options.breaks", ow.boolean);
            ow(o.skipSanitization, "Options.skipSanitization", ow.boolean);
            ow(o.addNofollowToLinks, "Options.addNofollowToLinks", ow.boolean);
            ow(o.doNotShowImages, "Options.doNotShowImages", ow.boolean);
            ow(o.ipfsPrefix, "Options.ipfsPrefix", ow.string);
            ow(o.assetsWidth, "Options.assetsWidth", ow.number.integer.positive);
            ow(o.assetsHeight, "Options.assetsHeight", ow.number.integer.positive);
            ow(o.imageProxyFn, "Options.imageProxyFn", ow.function);
            ow(o.hashtagUrlFn, "Options.hashtagUrlFn", ow.function);
            ow(o.usertagUrlFn, "Options.usertagUrlFn", ow.function);
            ow(o.isLinkSafeFn, "TagTransformingSanitizer.Options.isLinkSafeFn", ow.function);
        }
    }
}
