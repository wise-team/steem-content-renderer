import { Log } from "../../../../Log";
import linksRe from "../utils/Links";

import { AbstractVideoEmbedder } from "./AbstractVideoEmbedder";

export class TwitchEmbedder extends AbstractVideoEmbedder {
    private static TYPE = "twitch";

    public markEmbedIfFound(child: HTMLObjectElement) {
        try {
            const data = child.data;
            const twitch = this.twitchId(data);
            if (!twitch) {
                return undefined;
            }

            const embedMarker = AbstractVideoEmbedder.getEmbedMarker(twitch.id, TwitchEmbedder.TYPE);
            child.data = data.replace(twitch.url, embedMarker);

            return { link: twitch.canonical };
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
        if (embedType !== TwitchEmbedder.TYPE) return undefined;
        const url = `https://player.twitch.tv/${id}`;
        return `<div className="videoWrapper">
                <iframe
                    key=${htmlElementKey}
                    src=${url}
                    width=${size.width}
                    height=${size.height}
                    rameBorder="0"
                    allowFullScreen
                />
            </div>`;
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
}
