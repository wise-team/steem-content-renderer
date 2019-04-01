export class Sanitizer {
    public constructor() {}

    public preliminarySanitize(text: string): string {
        return this.stripHtmlComments(text);
    }

    public sanitize(text: string): string {
        return sanitize(
            text,
            sanitizeConfig({
                large: this.options.large,
                highQualityPost: this.options.highQualityPost,
                noImage: this.options.hideImages,
            }),
        );
    }

    private stripHtmlComments(text: string) {
        return text.replace(/<!--([\s\S]+?)(-->|$)/g, "(html comment removed: $1)");
    }
}

export namespace Sanitizer {
    export function isHtml(text: string): boolean {
        let html = false;
        // See also ReplyEditor isHtmlTest
        const m = text.match(/^<html>([\S\s]*)<\/html>$/);
        if (m && m.length === 2) {
            html = true;
            text = m[1];
        } else {
            // See also ReplyEditor isHtmlTest
            html = /^<p>[\S\s]*<\/p>/.test(text);
        }
        return html;
    }
}
