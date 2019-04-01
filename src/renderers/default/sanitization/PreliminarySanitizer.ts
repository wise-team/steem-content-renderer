export class PreliminarySanitizer {
    public static preliminarySanitize(text: string): string {
        return PreliminarySanitizer.stripHtmlComments(text);
    }

    private static stripHtmlComments(text: string) {
        return text.replace(/<!--([\s\S]+?)(-->|$)/g, "(html comment removed: $1)");
    }
}
