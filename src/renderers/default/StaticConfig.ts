/**
 * This file is based on
 *  - https://github.com/steemit/condenser/blob/master/src/app/utils/SanitizeConfig.js
 */
// tslint:disable max-line-length
export class StaticConfig {
    public static sanitization = {
        iframeWhitelist: [
            {
                re: /^(https?:)?\/\/player.vimeo.com\/video\/.*/i,
                fn: (src: string) => {
                    // <iframe src="https://player.vimeo.com/video/179213493" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
                    if (!src) {
                        return null;
                    }
                    const m = src.match(/https:\/\/player\.vimeo\.com\/video\/([0-9]+)/);
                    if (!m || m.length !== 2) {
                        return null;
                    }
                    return "https://player.vimeo.com/video/" + m[1];
                },
            },
            {
                re: /^(https?:)?\/\/www.youtube.com\/embed\/.*/i,
                fn: (src: string) => {
                    return src.replace(/\?.+$/, ""); // strip query string (yt: autoplay=1,controls=0,showinfo=0, etc)
                },
            },
            {
                re: /^https:\/\/w.soundcloud.com\/player\/.*/i,
                fn: (src: string) => {
                    if (!src) {
                        return null;
                    }
                    // <iframe width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/257659076&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>
                    const m = src.match(/url=(.+?)&/);
                    if (!m || m.length !== 2) {
                        return null;
                    }
                    return (
                        "https://w.soundcloud.com/player/?url=" +
                        m[1] +
                        "&auto_play=false&hide_related=false&show_comments=true" +
                        "&show_user=true&show_reposts=false&visual=true"
                    );
                },
            },
            {
                re: /^(https?:)?\/\/player.twitch.tv\/.*/i,
                fn: (src: string) => {
                    // <iframe src="https://player.twitch.tv/?channel=ninja" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620">
                    return src;
                },
            },
        ],
        noImageText: "(Image not shown due to low ratings)",
        allowedTags: `
    div, iframe, del,
    a, p, b, i, q, br, ul, li, ol, img, h1, h2, h3, h4, h5, h6, hr,
    blockquote, pre, code, em, strong, center, table, thead, tbody, tr, th, td,
    strike, sup, sub
`
            .trim()
            .split(/,\s*/),
    };
}
