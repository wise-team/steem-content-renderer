import { Log } from "../../../../Log";
import linksRe from "../utils/Links";

import { AbstractVideoEmbedder } from "./AbstractVideoEmbedder";

export class VimeoEmbedder extends AbstractVideoEmbedder {
    private static TYPE = "vimeo";

    public markEmbedIfFound(child: HTMLObjectElement) {
        try {
            const data = child.data;
            const vimeo = this.vimeoId(data);
            if (!vimeo) {
                return undefined;
            }
            const embedMarker = AbstractVideoEmbedder.getEmbedMarker(vimeo.id, VimeoEmbedder.TYPE);

            child.data = data.replace(vimeo.url, embedMarker);

            return { link: vimeo.canonical };
        } catch (error) {
            Log.log().error(error);
        }
        return undefined;
    }

    public processEmbedIfRelevant(
        embedType: string,
        id: string,
        size: { width: number; height: number },
        htmlElementKey: string,
    ): string | undefined {
        if (embedType !== VimeoEmbedder.TYPE) return undefined;
        const url = `https://player.vimeo.com/video/${id}`;
        return `<div className="videoWrapper">
            <iframe
                key=${htmlElementKey}
                src=${url}
                width=${size.width}
                height=${size.height}
                frameBorder="0"
                webkitallowfullscreen
                mozallowfullscreen
                allowFullScreen
            />
        </div>`;
    }

    private vimeoId(data: string) {
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
}
