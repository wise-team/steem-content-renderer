import ow from "ow";

export interface DefaultRendererLocalization {
    phishingWarning: string; // "Link expanded to plain text; beware of a potential phishing attempt"
    externalLink: string; // "This link will take you away from example.com"
    noImage: string; // "Images not allowed"
}

export namespace DefaultRendererLocalization {
    export function validate(o: DefaultRendererLocalization) {
        ow(o, "DefaultRendererLocalization", ow.object);
        ow(o.phishingWarning, "DefaultRendererLocalization.phishingWarningMessage", ow.string.nonEmpty);
        ow(o.externalLink, "DefaultRendererLocalization.externalLink", ow.string.nonEmpty);
        ow(o.noImage, "DefaultRendererLocalization.noImage", ow.string.nonEmpty);
    }

    export const DEFAULT: DefaultRendererLocalization = {
        phishingWarning: "Link expanded to plain text; beware of a potential phishing attempt",
        externalLink: "This link will take you away from example.com",
        noImage: "Images not allowed",
    };
}
