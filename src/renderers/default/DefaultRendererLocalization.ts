import ow from "ow";

export interface DefaultRendererLocalization {
    phishingWarning: string; // "Link expanded to plain text; beware of a potential phishing attempt"
    externalLink: string; // "This link will take you away from example.com"
    noImage: string; // "Images not allowed"
    accountNameWrongLength: string; // "Account name should be between 3 and 16 characters long."
    accountNameBadActor: string; // "This account is on a bad actor list"
    accountNameWrongSegment: string; // "This account name contains a bad segment"
}

export namespace DefaultRendererLocalization {
    export function validate(o: DefaultRendererLocalization) {
        ow(o, "DefaultRendererLocalization", ow.object);
        ow(o.phishingWarning, "DefaultRendererLocalization.phishingWarningMessage", ow.string.nonEmpty);
        ow(o.externalLink, "DefaultRendererLocalization.externalLink", ow.string.nonEmpty);
        ow(o.noImage, "DefaultRendererLocalization.noImage", ow.string.nonEmpty);
        ow(o.accountNameWrongLength, "DefaultRendererLocalization.accountNameWrongLength", ow.string.nonEmpty);
        ow(o.accountNameBadActor, "DefaultRendererLocalization.accountNameBadActor", ow.string.nonEmpty);
        ow(o.accountNameWrongSegment, "DefaultRendererLocalization.accountNameWrongSegment", ow.string.nonEmpty);
    }

    export const DEFAULT: DefaultRendererLocalization = {
        phishingWarning: "Link expanded to plain text; beware of a potential phishing attempt",
        externalLink: "This link will take you away from example.com",
        noImage: "Images not allowed",
        accountNameWrongLength: "Account name should be between 3 and 16 characters long",
        accountNameBadActor: "This account is on a bad actor list",
        accountNameWrongSegment: "This account name contains a bad segment",
    };
}
