import { AbstractVideoEmbedder } from "./AbstractVideoEmbedder";
import { TwitchEmbedder } from "./TwitchEmbedder";
import { VimeoEmbedder } from "./VimeoEmbedder";
import { YoutubeEmbedder } from "./YoutubeEmbedder";

export class VideoEmbedders {
    public static LIST: AbstractVideoEmbedder[] = [
        //
        new YoutubeEmbedder(),
        new VimeoEmbedder(),
        new TwitchEmbedder(),
    ];

    public static processTextNodeAndInsertEmbeds(node: HTMLObjectElement): { links: string[]; images: string[] } {
        const out: { links: string[]; images: string[] } = { links: [], images: [] };

        for (const embedder of VideoEmbedders.LIST) {
            const markResult = embedder.markEmbedIfFound(node);
            if (markResult) {
                if (markResult.image) out.images.push(markResult.image);
                if (markResult.link) out.links.push(markResult.link);
            }
        }
        return out;
    }

    public static insertMarkedEmbedsToRenderedOutput(input: string, size: { width: number; height: number }): string {
        return AbstractVideoEmbedder.insertAllEmbeds(VideoEmbedders.LIST, input, size);
    }
}
