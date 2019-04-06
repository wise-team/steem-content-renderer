/**
 * Based on: https://github.com/steemit/condenser/raw/master/src/shared/HtmlReady.js
 */
// tslint:disable max-classes-per-file
import ow from "ow";
import { CustomError } from "universe-log";
import * as xmldom from "xmldom";

import { Log } from "../../../Log";
import { DefaultRendererLocalization } from "../DefaultRendererLocalization";

import { AccountNameValidator } from "./utils/AccountNameValidator";
import linksRe, { any as linksAny } from "./utils/Links";
import * as Phishing from "./utils/Phishing";

export class HtmlParser {
    private options: HtmlParser.Options;
    private localization: DefaultRendererLocalization;

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
    private state: HtmlParser.State;
    private mutate = true;
    private parsedDocument: Document | undefined = undefined;

    public constructor(
        options: HtmlParser.Options,
        localization: DefaultRendererLocalization = DefaultRendererLocalization.DEFAULT,
    ) {
        HtmlParser.Options.validate(options);
        this.options = options;
        this.localization = localization;

        this.state = {
            hashtags: new Set(),
            usertags: new Set(),
            htmltags: new Set(),
            images: new Set(),
            links: new Set(),
        };
    }

    public setMutateEnabled(mutate: boolean): HtmlParser {
        this.mutate = mutate;
        return this;
    }

    public parse(html: string): HtmlParser {
        try {
            const doc: Document = this.domParser.parseFromString(html, "text/html");
            this.traverseDOMNode(doc);
            if (this.mutate) this.postprocessDOM(doc);
            this.parsedDocument = doc;
        } catch (error) {
            throw new HtmlParser.HtmlParserError("Parsing error", error);
        }

        return this;
    }

    public getState(): HtmlParser.State {
        if (!this.parsedDocument) throw new HtmlParser.HtmlParserError("Html has not been parsed yet");
        return this.state;
    }

    public getParsedDocument(): Document {
        if (!this.parsedDocument) throw new HtmlParser.HtmlParserError("Html has not been parsed yet");
        return this.parsedDocument;
    }

    public getParsedDocumentAsString(): string {
        return this.xmlSerializer.serializeToString(this.getParsedDocument());
    }

    private traverseDOMNode(node: ChildNode | Document, depth = 0) {
        if (!node || !node.childNodes) {
            return;
        }

        Array.from(node.childNodes).forEach(child => {
            const tag = (child as any).tagName ? (child as any).tagName.toLowerCase() : null;
            if (tag) {
                this.state.htmltags.add(tag);
            }

            if (tag === "img") {
                this.processImgTag(child);
            } else if (tag === "iframe") {
                this.processIframeTag(child);
            } else if (tag === "a") {
                this.processLinkTag(child);
            } else if (child.nodeName === "#text") {
                this.processTextNode(child);
            }

            this.traverseDOMNode(child, depth + 1);
        });
    }

    private processLinkTag(child: Node) {
        const url = (child as any).getAttribute("href");
        if (url) {
            this.state.links.add(url);
            if (this.mutate) {
                // If this link is not relative, http, https, or steem -- add https.
                if (!/^((#)|(\/(?!\/))|(((steem|https?):)?\/\/))/.test(url)) {
                    (child as any).setAttribute("href", "https://" + url);
                }

                // Unlink potential phishing attempts
                if (this.options.phishingUrlTestFn(url) || Phishing.looksPhishy(url)) {
                    const phishyDiv = (child as any).ownerDocument.createElement("div");
                    phishyDiv.textContent = `${child.textContent} / ${url}`;
                    phishyDiv.setAttribute("title", this.localization.phishingWarning);
                    phishyDiv.setAttribute("class", "phishy");
                    (child as any).parentNode.replaceChild(phishyDiv, child);
                }
            }
        }
    }

    // wrap iframes in div.videoWrapper to control size/aspect ratio
    private processIframeTag(child: any) {
        const url = child.getAttribute("src");
        if (url) {
            const { images, links } = this.state;
            const yt = this.youTubeId(url);
            if (yt && images && links) {
                links.add(yt.url);
                images.add("https://img.youtube.com/vi/" + yt.id + "/0.jpg");
            }
        }

        if (!this.mutate) {
            return;
        }

        const tag = child.parentNode.tagName ? child.parentNode.tagName.toLowerCase() : child.parentNode.tagName;
        if (tag === "div" && child.parentNode.getAttribute("class") === "videoWrapper") {
            return;
        }
        const html = this.xmlSerializer.serializeToString(child);
        child.parentNode.replaceChild(this.domParser.parseFromString(`<div class="videoWrapper">${html}</div>`), child);
    }

    private processImgTag(child: any) {
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

    private processTextNode(child: any) {
        try {
            const tag = child.parentNode.tagName ? child.parentNode.tagName.toLowerCase() : child.parentNode.tagName;
            if (tag === "code") {
                return;
            }
            if (tag === "a") {
                return;
            }

            if (!child.data) {
                return;
            }
            child = this.embedYouTubeNode(child);
            child = this.embedVimeoNode(child);
            child = this.embedTwitchNode(child);

            const data = this.xmlSerializer.serializeToString(child);
            const content = this.linkify(
                data,
                this.state.hashtags,
                this.state.usertags,
                this.state.images,
                this.state.links,
            );
            if (this.mutate && content !== data) {
                const newChild = this.domParser.parseFromString(`<span>${content}</span>`);
                child.parentNode.replaceChild(newChild, child);
                return newChild;
            }
        } catch (error) {
            Log.log().error(error);
        }
    }

    private linkify(content: string, hashtags: any, usertags: any, images: any, links: any) {
        // hashtag
        content = content.replace(/(^|\s)(#[-a-z\d]+)/gi, tag => {
            if (/#[\d]+$/.test(tag)) {
                return tag;
            } // Don't allow numbers to be tags
            const space = /^\s/.test(tag) ? tag[0] : "";
            const tag2 = tag.trim().substring(1);
            const tagLower = tag2.toLowerCase();
            if (hashtags) {
                hashtags.add(tagLower);
            }
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

                if (valid && usertags) {
                    usertags.add(userLower);
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
                if (images) {
                    images.add(ln);
                }
                return `<img src="${this.normalizeUrl(ln)}" />`;
            }

            // do not linkify .exe or .zip urls
            if (/\.(zip|exe)$/i.test(ln)) {
                return ln;
            }

            // do not linkify phishy links
            if (Phishing.looksPhishy(ln)) {
                return `<div title='${this.localization.phishingWarning}' class='phishy'>${ln}</div>`;
            }

            if (links) {
                links.add(ln);
            }
            return `<a href="${this.normalizeUrl(ln)}">${ln}</a>`;
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

    private embedYouTubeNode(child: any) {
        try {
            const data = child.data;
            const yt = this.youTubeId(data);
            if (!yt) {
                return child;
            }

            child.data = data.replace(yt.url, `~~~ embed:${yt.id} youtube ~~~`);

            this.state.links.add(yt.url);
            this.state.images.add(yt.thumbnail);
        } catch (error) {
            Log.log().error(error);
        }
        return child;
    }

    /** @return {id, url} or <b>null</b> */
    private youTubeId(data: any) {
        if (!data) {
            return null;
        }

        const m1 = data.match(linksRe.youTube);
        const url = m1 ? m1[0] : null;
        if (!url) {
            return null;
        }

        const m2 = url.match(linksRe.youTubeId);
        const id = m2 && m2.length >= 2 ? m2[1] : null;
        if (!id) {
            return null;
        }

        return {
            id,
            url,
            thumbnail: "https://img.youtube.com/vi/" + id + "/0.jpg",
        };
    }

    private embedVimeoNode(child: any) {
        try {
            const data = child.data;
            const vimeo = this.vimeoId(data);
            if (!vimeo) {
                return child;
            }

            child.data = data.replace(vimeo.url, `~~~ embed:${vimeo.id} vimeo ~~~`);

            this.state.links.add(vimeo.canonical);
            // if(images) images.add(vimeo.thumbnail) // not available
        } catch (error) {
            Log.log().error(error);
        }
        return child;
    }

    private vimeoId(data: any) {
        if (!data) {
            return null;
        }
        const m = data.match(linksRe.vimeo);
        if (!m || m.length < 2) {
            return null;
        }

        return {
            id: m[1],
            url: m[0],
            canonical: `https://player.vimeo.com/video/${m[1]}`,
            // thumbnail: requires a callback - http://stackoverflow.com/questions/1361149/get-img-thumbnails-from-vimeo
        };
    }

    private embedTwitchNode(child: any) {
        try {
            const data = child.data;
            const twitch = this.twitchId(data);
            if (!twitch) {
                return child;
            }

            child.data = data.replace(twitch.url, `~~~ embed:${twitch.id} twitch ~~~`);

            this.state.links.add(twitch.canonical);
        } catch (error) {
            Log.log().error(error);
        }
        return child;
    }

    private twitchId(data: any) {
        if (!data) {
            return null;
        }
        const m = data.match(linksRe.twitch);
        if (!m || m.length < 3) {
            return null;
        }

        return {
            id: m[1] === `videos` ? `?video=${m[2]}` : `?channel=${m[2]}`,
            url: m[0],
            canonical:
                m[1] === `videos`
                    ? `https://player.twitch.tv/?video=${m[2]}`
                    : `https://player.twitch.tv/?channel=${m[2]}`,
        };
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

export namespace HtmlParser {
    export interface Options {
        ipfsPrefix: string;
        imageProxyFn: (url: string) => string;
        hashtagUrlFn: (hashtag: string) => string;
        usertagUrlFn: (account: string) => string;
        phishingUrlTestFn: (url: string) => boolean;
        hideImages: boolean;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o, "HtmlParser.Options", ow.object);
            ow(o.ipfsPrefix, "HtmlParser.Options.ipfsPrefix", ow.string);
            ow(o.imageProxyFn, "HtmlParser.Options.imageProxyFn", ow.function);
            ow(o.hashtagUrlFn, "HtmlParser.Options.hashtagUrlFn", ow.function);
            ow(o.usertagUrlFn, "HtmlParser.Options.usertagUrlFn", ow.function);
            ow(o.phishingUrlTestFn, "HtmlParser.Options.phishingUrlTestFn", ow.function);
            ow(o.hideImages, "HtmlParser.Options.hideImages", ow.boolean);
        }
    }

    export interface State {
        hashtags: Set<string>;
        usertags: Set<string>;
        htmltags: Set<string>;
        images: Set<string>;
        links: Set<string>;
    }

    export class HtmlParserError extends CustomError {
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
