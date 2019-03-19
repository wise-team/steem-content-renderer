import ow from "ow";

export class Embedder {
    private options: Embedder.Options;
    public constructor(options: Embedder.Options) {
        Embedder.Options.validate(options);
        this.options = options;
    }

    public markAssets(input: string): string {
        return HtmlReady(renderedText, { hideImages }).html;
    }

    public insertAssets(input: string, width: boolean, height: boolean) {
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
                const w = large ? 640 : 480,
                    h = large ? 360 : 270;
                if (type === "youtube") {
                    sections.push(
                        `<YoutubePreview
                            key={idx++}
                            width={w}
                            height={h}
                            youTubeId={id}
                            frameBorder="0"
                            allowFullScreen="true"
                        />`,
                    );
                } else if (type === "vimeo") {
                    const url = `https://player.vimeo.com/video/${id}`;
                    sections.push(
                        `<div className="videoWrapper">
                            <iframe
                                key={idx++}
                                src={url}
                                width={w}
                                height={h}
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
                            <iframe key={idx++} src={url} width={w} height={h} frameBorder="0" allowFullScreen />
                        </div>`,
                    );
                } else {
                    console.error("MarkdownViewer unknown embed type", type);
                }
                section = section.substring(`${id} ${type} ~~~`.length);
                if (section === "") continue;
            }
            sections.push(
                `<div
                    key={idx++}
                    dangerouslySetInnerHTML={{
                        __html: section,
                    }}
                />`,
            );
        }
        return sections.join();
    }
}

export namespace Embedder {
    export interface Options {}

    export namespace Options {
        export function validate(o: Options) {}
    }
}
