import ow from "ow";

import { Log } from "../../../Log";
import { DefaultRendererLocalization } from "../DefaultRendererLocalization";

import { HtmlParser } from "./HtmlParser";

export class AssetEmbedder {
    private options: AssetEmbedder.Options;
    private localization: DefaultRendererLocalization;

    public constructor(options: AssetEmbedder.Options, localization: DefaultRendererLocalization) {
        AssetEmbedder.Options.validate(options);
        this.options = options;
        this.localization = localization;
    }

    public markAssets(input: string): string {
        const parser = new HtmlParser(
            {
                ipfsPrefix: this.options.ipfsPrefix,
                hideImages: this.options.hideImages,
                imageProxyFn: this.options.imageProxyFn,
                hashtagUrlFn: this.options.hashtagUrlFn,
                usertagUrlFn: this.options.usertagUrlFn,
            },
            this.localization,
        );
        return parser.parse(input).getParsedDocumentAsString();
    }

    public insertAssets(input: string) {
        // In addition to inserting the youtube component, this allows
        // react to compare separately preventing excessive re-rendering.
        let idx = 0;
        const sections = [];

        // HtmlReady inserts ~~~ embed:${id} type ~~~
        for (let section of input.split("~~~ embed:")) {
            const match = section.match(/^([A-Za-z0-9\?\=\_\-]+) (youtube|vimeo|twitch) ~~~/);
            if (match && match.length >= 3) {
                const id = match[1];
                const type = match[2];
                if (type === "youtube") {
                    sections.push(
                        `<YoutubePreview
                            key=${idx++}
                            width=${this.options.width}
                            height=${this.options.height}
                            youTubeId=${id}
                            frameBorder="0"
                            allowFullScreen="true"
                        />`,
                    );
                } else if (type === "vimeo") {
                    const url = `https://player.vimeo.com/video/${id}`;
                    sections.push(
                        `<div className="videoWrapper">
                            <iframe
                                key=${idx++}
                                src=${url}
                                width=${this.options.width}
                                height=${this.options.height}
                                frameBorder="0"
                                webkitallowfullscreen
                                mozallowfullscreen
                                allowFullScreen
                            />
                        </div>`,
                    );
                } else if (type === "twitch") {
                    const url = `https://player.twitch.tv/${id}`;
                    sections.push(
                        `<div className="videoWrapper">
                            <iframe
                                key=${idx++}
                                src=${url}
                                width=${this.options.width}
                                height=${this.options.height}
                                rameBorder="0"
                                allowFullScreen
                            />
                        </div>`,
                    );
                } else {
                    Log.log().warn("MarkdownViewer unknown embed type", type);
                }
                section = section.substring(`${id} ${type} ~~~`.length);
                if (section === "") {
                    continue;
                }
            }
            sections.push(
                /*`<div
                    key=${idx++}
                    dangerouslySetInnerHTML=${{
                        __html: section,
                    }}
                />`,*/
                section,
            );
        }
        return sections.join();
    }
}

export namespace AssetEmbedder {
    export interface Options {
        ipfsPrefix: string;
        width: number;
        height: number;
        hideImages: boolean;
        imageProxyFn: (url: string) => string;
        hashtagUrlFn: (hashtag: string) => string;
        usertagUrlFn: (account: string) => string;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.ipfsPrefix, "AssetEmbedder.Options.ipfsPrefix", ow.string);
            ow(o.width, "AssetEmbedder.Options.width", ow.number.integer.positive);
            ow(o.height, "AssetEmbedder.Options.height", ow.number.integer.positive);
            ow(o.hideImages, "AssetEmbedder.Options.hideImages", ow.boolean);
            ow(o.imageProxyFn, "AssetEmbedder.Options.imageProxyFn", ow.function);
            ow(o.hashtagUrlFn, "HtmlParser.Options.hashtagUrlFn", ow.function);
            ow(o.usertagUrlFn, "HtmlParser.Options.usertagUrlFn", ow.function);
        }
    }
}
