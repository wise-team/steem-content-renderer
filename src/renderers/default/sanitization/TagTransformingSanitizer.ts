/**
 * This file is based on https://github.com/steemit/condenser/blob/master/src/app/utils/SanitizeConfig.js
 */
import ow from "ow";
import * as sanitize from "sanitize-html";

import { Log } from "../../../Log";
import { StaticConfig } from "../StaticConfig";

export class TagTransformingSanitizer {
    private options: TagTransformingSanitizer.Options;
    private sanitizationErrors: string[] = [];

    public constructor(options: TagTransformingSanitizer.Options) {
        TagTransformingSanitizer.Options.validate(options);

        this.options = options;
    }

    public sanitize(text: string): string {
        return sanitize(text, this.generateSanitizeConfig());
    }

    public getErrors(): string[] {
        return this.sanitizationErrors;
    }

    private generateSanitizeConfig(): sanitize.IOptions {
        return {
            allowedTags: StaticConfig.sanitization.allowedTags,

            // SEE https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
            allowedAttributes: {
                // "src" MUST pass a whitelist (below)
                iframe: [
                    "src",
                    "width",
                    "height",
                    "frameborder",
                    "allowfullscreen",
                    "webkitallowfullscreen",
                    "mozallowfullscreen",
                ],

                // class attribute is strictly whitelisted (below)
                // and title is only set in the case of a phishing warning
                div: ["class", "title"],

                // style is subject to attack, filtering more below
                td: ["style"],
                img: ["src", "alt"],

                // title is only set in the case of an external link warning
                a: ["href", "rel", "title"],
            },
            allowedSchemes: ["http", "https", "steem"],
            transformTags: {
                iframe: (tagName: string, attribs: sanitize.Attributes) => {
                    const srcAtty = attribs.src;
                    for (const item of StaticConfig.sanitization.iframeWhitelist) {
                        if (item.re.test(srcAtty)) {
                            const src = typeof item.fn === "function" ? item.fn(srcAtty) : srcAtty;
                            if (!src) {
                                break;
                            }
                            const iframeToBeReturned: sanitize.Tag = {
                                tagName: "iframe",
                                attribs: {
                                    frameborder: "0",
                                    allowfullscreen: "allowfullscreen",

                                    // deprecated but required for vimeo : https://vimeo.com/forums/help/topic:278181
                                    webkitallowfullscreen: "webkitallowfullscreen",

                                    mozallowfullscreen: "mozallowfullscreen", // deprecated but required for vimeo
                                    src,
                                    width: this.options.iframeWidth + "",
                                    height: this.options.iframeHeight + "",
                                },
                            };
                            return iframeToBeReturned;
                        }
                    }
                    Log.log().warn('Blocked, did not match iframe "src" white list urls:', tagName, attribs);
                    this.sanitizationErrors.push("Invalid iframe URL: " + srcAtty);

                    const retTag: sanitize.Tag = { tagName: "div", text: `(Unsupported ${srcAtty})`, attribs: {} };
                    return retTag;
                },
                img: (tagName, attribs) => {
                    if (this.options.noImage) {
                        const retTagOnImagesNotAllowed: sanitize.Tag = {
                            tagName: "div",
                            text: this.options.localization.noImageMessage,
                            attribs: {},
                        };
                        return retTagOnImagesNotAllowed;
                    }
                    // See https://github.com/punkave/sanitize-html/issues/117
                    const { src, alt } = attribs;
                    if (!/^(https?:)?\/\//i.test(src)) {
                        Log.log().warn("Blocked, image tag src does not appear to be a url", tagName, attribs);
                        this.sanitizationErrors.push("An image in this post did not save properly.");
                        const retTagOnNoUrl: sanitize.Tag = {
                            tagName: "img",
                            attribs: { src: "brokenimg.jpg" },
                        };
                        return retTagOnNoUrl;
                    }

                    const atts: sanitize.Attributes = {};
                    atts.src = src.replace(/^http:\/\//i, "//"); // replace http:// with // to force https when needed
                    if (alt && alt !== "") {
                        atts.alt = alt;
                    }
                    const retTag: sanitize.Tag = { tagName, attribs: atts };
                    return retTag;
                },
                div: (tagName, attribs) => {
                    const attys: sanitize.Attributes = {};
                    const classWhitelist = [
                        "pull-right",
                        "pull-left",
                        "text-justify",
                        "text-rtl",
                        "text-center",
                        "text-right",
                        "videoWrapper",
                        "phishy",
                    ];
                    const validClass = classWhitelist.find(e => attribs.class === e);
                    if (validClass) {
                        attys.class = validClass;
                    }
                    if (validClass === "phishy" && attribs.title === this.options.localization.phishingWarningMessage) {
                        attys.title = attribs.title;
                    }
                    const retTag: sanitize.Tag = {
                        tagName,
                        attribs: attys,
                    };
                    return retTag;
                },
                td: (tagName, attribs) => {
                    const attys: sanitize.Attributes = {};
                    if (attribs.style === "text-align:right") {
                        attys.style = "text-align:right";
                    }
                    const retTag: sanitize.Tag = {
                        tagName,
                        attribs: attys,
                    };
                    return retTag;
                },
                a: (tagName, attribs) => {
                    let { href } = attribs;
                    if (!href) {
                        href = "#";
                    }
                    href = href.trim();
                    const attys: sanitize.Attributes = { href };
                    // If it's not a (relative or absolute) steemit URL...
                    if (!href.match(/^(\/(?!\/)|https:\/\/steemit.com)/)) {
                        // attys.target = '_blank' // pending iframe impl https://mathiasbynens.github.io/rel-noopener/
                        attys.rel = this.options.addNofollowToLinks ? "nofollow noopener" : "noopener";
                        attys.title = this.options.localization.phishingWarningMessage;
                    }
                    const retTag: sanitize.Tag = {
                        tagName,
                        attribs: attys,
                    };
                    return retTag;
                },
            },
        };
    }
}

export namespace TagTransformingSanitizer {
    export interface Options {
        iframeWidth: number;
        iframeHeight: number;
        addNofollowToLinks: boolean;
        noImage: boolean;
        localization: {
            noImageMessage: string;
            phishingWarningMessage: string;
        };
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.iframeWidth, "TagTransformingSanitizer.Options.iframeWidth", ow.number.integer.positive);
            ow(o.iframeHeight, "TagTransformingSanitizer.Options.iframeHeight", ow.number.integer.positive);
            ow(o.addNofollowToLinks, "TagTransformingSanitizer.Options.addNofollowToLinks", ow.boolean);
            ow(o.noImage, "TagTransformingSanitizer.Options.noImage", ow.boolean);
            ow(o.localization, "TagTransformingSanitizer.Options.localization", ow.object);
            ow(
                o.localization.noImageMessage,
                "TagTransformingSanitizer.Options.localization.noImageMessage",
                ow.string.nonEmpty,
            );
            ow(
                o.localization.phishingWarningMessage,
                "TagTransformingSanitizer.Options.localization.phishingWarningMessage",
                ow.string.nonEmpty,
            );
        }
    }
}
