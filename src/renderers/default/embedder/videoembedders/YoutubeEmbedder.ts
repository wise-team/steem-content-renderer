import { Log } from "../../../../Log";
import linksRe from "../utils/Links";

import { AbstractVideoEmbedder } from "./AbstractVideoEmbedder";

export class YoutubeEmbedder extends AbstractVideoEmbedder {
    /** @return {id, url} or <b>null</b> */
    public static getYoutubeMetadataFromLink(data: string): { id: string; url: string; thumbnail: string } | null {
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

    private static TYPE = "youtube";

    public markEmbedIfFound(child: HTMLObjectElement) {
        try {
            const data = child.data;
            const yt = YoutubeEmbedder.getYoutubeMetadataFromLink(data);
            if (!yt) {
                return undefined;
            }

            const embedMarker = AbstractVideoEmbedder.getEmbedMarker(yt.id, YoutubeEmbedder.TYPE);
            child.data = data.replace(yt.url, embedMarker);

            return { image: yt.thumbnail, link: yt.url };
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
        if (embedType !== YoutubeEmbedder.TYPE) return undefined;
        return `<YoutubePreview
                key=${htmlElementKey}
                width=${size.width}
                height=${size.height}
                youTubeId=${id}
                frameBorder="0"
                allowFullScreen="true"
            />`;
    }
}
