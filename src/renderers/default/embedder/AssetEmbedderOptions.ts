import ow from "ow";

export interface AssetEmbedderOptions {
    ipfsPrefix: string;
    width: number;
    height: number;
    hideImages: boolean;
    imageProxyFn: (url: string) => string;
    hashtagUrlFn: (hashtag: string) => string;
    usertagUrlFn: (account: string) => string;
}

export namespace AssetEmbedderOptions {
    export function validate(o: AssetEmbedderOptions) {
        ow(o.ipfsPrefix, "AssetEmbedderOptions.ipfsPrefix", ow.string);
        ow(o.width, "AssetEmbedderOptions.width", ow.number.integer.positive);
        ow(o.height, "AssetEmbedderOptions.height", ow.number.integer.positive);
        ow(o.hideImages, "AssetEmbedderOptions.hideImages", ow.boolean);
        ow(o.imageProxyFn, "AssetEmbedderOptions.imageProxyFn", ow.function);
        ow(o.hashtagUrlFn, "AssetEmbedderOptions.hashtagUrlFn", ow.function);
        ow(o.usertagUrlFn, "AssetEmbedderOptions.usertagUrlFn", ow.function);
    }
}
