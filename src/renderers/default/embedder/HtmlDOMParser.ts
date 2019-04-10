/**
 * Based on: https://github.com/steemit/condenser/raw/master/src/shared/HtmlReady.js
 */
// tslint:disable max-classes-per-file
import { CustomError } from "universe-log";
import * as xmldom from "xmldom";

import { Log } from "../../../Log";
import { LinkSanitizer } from "../../../security/LinkSanitizer";
import { DefaultRendererLocalization } from "../DefaultRendererLocalization";

import { AssetEmbedderOptions } from "./AssetEmbedderOptions";
import { AccountNameValidator } from "./utils/AccountNameValidator";
import linksRe, { any as linksAny } from "./utils/Links";
import { VideoEmbedders } from "./videoembedders/VideoEmbedders";
import { YoutubeEmbedder } from "./videoembedders/YoutubeEmbedder";

export class HtmlDOMParser {
    private options: AssetEmbedderOptions;
    private localization: DefaultRendererLocalization;
    private linkSanitizer: LinkSanitizer;

    private domParser = new xmldom.DOMParser({
        errorHandler: {
            warning: () => {
                /* */
            },
            error: () => {
                /* */
            },
        },
    });
    private xmlSerializer = new xmldom.XMLSerializer();
    private state: HtmlDOMParser.State;
    private mutate = true;
    private parsedDocument: Document | undefined = undefined;

    public constructor(
        options: AssetEmbedderOptions,
        localization: DefaultRendererLocalization = DefaultRendererLocalization.DEFAULT,
    ) {
        AssetEmbedderOptions.validate(options);
        this.options = options;
        this.localization = localization;
        this.linkSanitizer = new LinkSanitizer({
            baseUrl: this.options.baseUrl,
        });

        this.state = {
            hashtags: new Set(),
            usertags: new Set(),
            htmltags: new Set(),
            images: new Set(),
            links: new Set(),
        };
    }

    public setMutateEnabled(mutate: boolean): HtmlDOMParser {
        this.mutate = mutate;
        return this;
    }

    public parse(html: string): HtmlDOMParser {
        try {
            const doc: Document = this.domParser.parseFromString(html, "text/html");
            this.traverseDOMNode(doc);
            if (this.mutate) this.postprocessDOM(doc);
            this.parsedDocument = doc;
        } catch (error) {
            throw new HtmlDOMParser.HtmlDOMParserError("Parsing error", error);
        }

        return this;
    }

    public getState(): HtmlDOMParser.State {
        if (!this.parsedDocument) throw new HtmlDOMParser.HtmlDOMParserError("Html has not been parsed yet");
        return this.state;
    }

    public getParsedDocument(): Document {
        if (!this.parsedDocument) throw new HtmlDOMParser.HtmlDOMParserError("Html has not been parsed yet");
        return this.parsedDocument;
    }

    public getParsedDocumentAsString(): string {
        return this.xmlSerializer.serializeToString(this.getParsedDocument());
    }

    private traverseDOMNode(node: Document | ChildNode, depth = 0) {
        if (!node || !node.childNodes) {
            return;
        }

        Array.from(node.childNodes).forEach(child => {
            const tag = (child as any).tagName ? (child as any).tagName.toLowerCase() : null;
            if (tag) {
                this.state.htmltags.add(tag);
            }

            if (tag === "img") {
                this.processImgTag(child as HTMLObjectElement);
            } else if (tag === "iframe") {
                this.processIframeTag(child as HTMLObjectElement);
            } else if (tag === "a") {
                this.processLinkTag(child as HTMLObjectElement);
            } else if (child.nodeName === "#text") {
                this.processTextNode(child as HTMLObjectElement);
            }

            this.traverseDOMNode(child, depth + 1);
        });
    }

    private processLinkTag(child: HTMLObjectElement) {
        const url = child.getAttribute("href");
        if (url) {
            this.state.links.add(url);
            if (this.mutate) {
                // Unlink potential phishing attempts
                const urlTitle = child.textContent + "";
                const sanitizedLink = this.linkSanitizer.sanitizeLink(url, urlTitle);
                if (sanitizedLink === false) {
                    const phishyDiv = (child as any).ownerDocument.createElement("div");
                    phishyDiv.textContent = `${child.textContent} / ${url}`;
                    phishyDiv.setAttribute("title", this.localization.phishingWarning);
                    phishyDiv.setAttribute("class", "phishy");
                    (child as any).parentNode.replaceChild(phishyDiv, child);
                } else {
                    child.setAttribute("href", sanitizedLink);
                }
            }
        }
    }

    // wrap iframes in div.videoWrapper to control size/aspect ratio
    private processIframeTag(child: HTMLObjectElement) {
        const url = child.getAttribute("src");
        if (url) this.reportIframeLink(url);

        if (!this.mutate) {
            return;
        }

        const tag = (child as any).parentNode.tagName
            ? (child as any).parentNode.tagName.toLowerCase()
            : (child as any).parentNode.tagName;
        if (tag === "div" && (child as any).parentNode.getAttribute("class") === "videoWrapper") {
            return;
        }
        const html = this.xmlSerializer.serializeToString(child);
        (child as any).parentNode.replaceChild(
            this.domParser.parseFromString(`<div class="videoWrapper">${html}</div>`),
            child,
        );
    }

    private reportIframeLink(url: string) {
        const yt = YoutubeEmbedder.getYoutubeMetadataFromLink(url);
        if (yt) {
            this.state.links.add(yt.url);
            this.state.images.add("https://img.youtube.com/vi/" + yt.id + "/0.jpg");
        }
    }

    private processImgTag(child: HTMLObjectElement) {
        const url = child.getAttribute("src");
        if (url) {
            this.state.images.add(url);
            if (this.mutate) {
                let url2 = this.normalizeUrl(url);
                if (/^\/\//.test(url2)) {
                    // Change relative protocol imgs to https
                    url2 = "https:" + url2;
                }
                if (url2 !== url) {
                    child.setAttribute("src", url2);
                }
            }
        }
    }

    private processTextNode(child: HTMLObjectElement) {
        try {
            const tag = (child.parentNode as any).tagName
                ? (child.parentNode as any).tagName.toLowerCase()
                : (child.parentNode as any).tagName;
            if (tag === "code") {
                return;
            }
            if (tag === "a") {
                return;
            }

            if (!child.data) {
                return;
            }

            const embedResp = VideoEmbedders.processTextNodeAndInsertEmbeds(child);
            embedResp.images.forEach(img => this.state.images.add(img));
            embedResp.links.forEach(link => this.state.links.add(link));

            const data = this.xmlSerializer.serializeToString(child);
            const content = this.linkify(data);
            if (this.mutate && content !== data) {
                const newChild = this.domParser.parseFromString(`<span>${content}</span>`);
                (child.parentNode as any).replaceChild(newChild, child);
                return newChild;
            }
        } catch (error) {
            Log.log().error(error);
        }
    }

    private linkify(content: string) {
        // hashtag
        content = content.replace(/(^|\s)(#[-a-z\d]+)/gi, tag => {
            if (/#[\d]+$/.test(tag)) {
                return tag;
            } // Don't allow numbers to be tags
            const space = /^\s/.test(tag) ? tag[0] : "";
            const tag2 = tag.trim().substring(1);
            const tagLower = tag2.toLowerCase();
            this.state.hashtags.add(tagLower);
            if (!this.mutate) {
                return tag;
            }
            const tagUrl = this.options.hashtagUrlFn(tagLower);
            return space + `<a href="${tagUrl}">${tag.trim()}</a>`;
        });

        // usertag (mention)
        // Cribbed from https://github.com/twitter/twitter-text/blob/v1.14.7/js/twitter-text.js#L90
        content = content.replace(
            /(^|[^a-zA-Z0-9_!#$%&*@＠\/]|(^|[^a-zA-Z0-9_+~.-\/#]))[@＠]([a-z][-\.a-z\d]+[a-z\d])/gi,
            (match, preceeding1, preceeding2, user) => {
                const userLower = user.toLowerCase();
                const valid = AccountNameValidator.validateAccountName(userLower, this.localization) == null;

                if (valid && this.state.usertags) {
                    this.state.usertags.add(userLower);
                }

                // include the preceeding matches if they exist
                const preceedings = (preceeding1 || "") + (preceeding2 || "");

                if (!this.mutate) {
                    return `${preceedings}${user}`;
                }

                const userTagUrl = this.options.usertagUrlFn(userLower);
                return valid ? `${preceedings}<a href="${userTagUrl}">@${user}</a>` : `${preceedings}@${user}`;
            },
        );

        content = content.replace(linksAny("gi"), ln => {
            if (linksRe.image.test(ln)) {
                this.state.images.add(ln);
                return `<img src="${this.normalizeUrl(ln)}" />`;
            }

            // do not linkify .exe or .zip urls
            if (/\.(zip|exe)$/i.test(ln)) {
                return ln;
            }

            // do not linkify phishy links
            const sanitizedLink = this.linkSanitizer.sanitizeLink(ln, ln);
            if (sanitizedLink === false) {
                return `<div title='${this.localization.phishingWarning}' class='phishy'>${ln}</div>`;
            }

            this.state.links.add(sanitizedLink);
            const out = `<a href="${this.normalizeUrl(ln)}">${sanitizedLink}</a>`;
            return out;
        });
        return content;
    }

    private postprocessDOM(doc: Document) {
        this.hideImagesIfNeeded(doc);
        this.proxifyImagesIfNeeded(doc);
    }

    private hideImagesIfNeeded(doc: Document) {
        if (this.mutate && this.options.hideImages) {
            for (const image of Array.from(doc.getElementsByTagName("img"))) {
                const pre = doc.createElement("pre");
                pre.setAttribute("class", "image-url-only");
                pre.appendChild(doc.createTextNode(image.getAttribute("src") || ""));
                if (image.parentNode) {
                    image.parentNode.replaceChild(pre, image);
                }
            }
        }
    }

    private proxifyImagesIfNeeded(doc: Document) {
        if (this.mutate && !this.options.hideImages) {
            this.proxifyImages(doc);
        }
    }

    // For all img elements with non-local URLs, prepend the proxy URL (e.g. `https://img0.steemit.com/0x0/`)
    private proxifyImages(doc: Document) {
        if (!doc) {
            return;
        }
        Array.from(doc.getElementsByTagName("img")).forEach(node => {
            const url: string = node.getAttribute("src") || "";
            if (!linksRe.local.test(url)) {
                node.setAttribute("src", this.options.imageProxyFn(url));
            }
        });
    }

    private normalizeUrl(url: any) {
        if (this.options.ipfsPrefix) {
            // Convert //ipfs/xxx  or /ipfs/xxx  into  https://steemit.com/ipfs/xxxxx
            if (/^\/?\/ipfs\//.test(url)) {
                const slash = url.charAt(1) === "/" ? 1 : 0;
                url = url.substring(slash + "/ipfs/".length); // start with only 1 /
                return this.options.ipfsPrefix + "/" + url;
            }
        }
        return url;
    }
}

export namespace HtmlDOMParser {
    export interface State {
        hashtags: Set<string>;
        usertags: Set<string>;
        htmltags: Set<string>;
        images: Set<string>;
        links: Set<string>;
    }

    export class HtmlDOMParserError extends CustomError {
        public constructor(message?: string, cause?: Error) {
            super(message, cause);
        }
    }
}

/*

*/

/****************
 * Legacy docs of HtmlReady:
 */
/**
 * Functions performed by HTMLReady
 *
 * State reporting
 *  - hashtags: collect all #tags in content
 *  - usertags: collect all @mentions in content
 *  - htmltags: collect all html <tags> used (for validation)
 *  - images: collect all image URLs in content
 *  - links: collect all href URLs in content
 *
 * Mutations
 *  - link()
 *    - ensure all <a> href's begin with a protocol. prepend https:// otherwise.
 *  - iframe()
 *    - wrap all <iframe>s in <div class="videoWrapper"> for responsive sizing
 *  - img()
 *    - convert any <img> src IPFS prefixes to standard URL
 *    - change relative protocol to https://
 *  - linkifyNode()
 *    - scans text content to be turned into rich content
 *    - embedYouTubeNode()
 *      - identify plain youtube URLs and prep them for "rich embed"
 *    - linkify()
 *      - scan text for:
 *        - #tags, convert to <a> links
 *        - @mentions, convert to <a> links
 *        - naked URLs
 *          - if img URL, normalize URL and convert to <img> tag
 *          - otherwise, normalize URL and convert to <a> link
 *  - proxifyImages()
 *    - prepend proxy URL to any non-local <img> src's
 *
 * We could implement 2 levels of HTML mutation for maximum reuse:
 *  1. Normalization of HTML - non-proprietary, pre-rendering cleanup/normalization
 *    - (state reporting done at this level)
 *    - normalize URL protocols
 *    - convert naked URLs to images/links
 *    - convert embeddable URLs to <iframe>s
 *    - basic sanitization?
 *  2. Steemit.com Rendering - add in proprietary Steemit.com functions/links
 *    - convert <iframe>s to custom objects
 *    - linkify #tags and @mentions
 *    - proxify images
 *
 * TODO:
 *  - change ipfsPrefix(url) to normalizeUrl(url)
 *    - rewrite IPFS prefixes to valid URLs
 *    - schema normalization
 *    - gracefully handle protocols like ftp, mailto
 */

/** Split the HTML on top-level elements. This allows react to compare separately, preventing excessive re-rendering.
 * Used in MarkdownViewer.jsx
 */
// export function sectionHtml (html) {
//   const doc = this.domParser.parseFromString(html, 'text/html')
//   const sections = Array(...doc.childNodes).map(child => this.xmlSerializer.serializeToString(child))
//   return sections
// }

/* Embed videos, link mentions and hashtags, etc...
    If hideImages and mutate is set to true all images will be replaced
    by <pre> elements containing just the image url.
*/
