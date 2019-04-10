import ow from "ow";

import { Log } from "../Log";

import { Phishing } from "./Phishing";

export class LinkSanitizer {
    private options: LinkSanitizer.Options;
    private baseUrl: URL;
    private topLevelsBaseDomain: string;

    public constructor(options: LinkSanitizer.Options) {
        LinkSanitizer.Options.validate(options);
        this.options = options;
        this.baseUrl = new URL(this.options.baseUrl);
        this.topLevelsBaseDomain = this.getTopLevelBaseDomainFromBaseUrl(this.baseUrl);
    }

    public sanitizeLink(url: string, urlTitle: string): string | false {
        url = this.prependUnknownProtocolLink(url);

        Log.log().debug("LinkSanitizer#sanitizeLink", { url, urlTitle });

        if (Phishing.looksPhishy(url)) {
            Log.log().debug("LinkSanitizer#sanitizeLink", "phishing link detected", "phishing list", url, {
                url,
                urlTitle,
            });
            return false;
        }

        if (this.isPseudoLocalUrl(url, urlTitle)) {
            Log.log().debug("LinkSanitizer#sanitizeLink", "phishing link detected", "pseudo local url", url, {
                url,
                urlTitle,
            });
            return false;
        }
        return url;
    }

    private getTopLevelBaseDomainFromBaseUrl(url: URL) {
        const regex = /([^\s\/$.?#]+\.[^\s\/$.?#]+)$/g;
        const m = regex.exec(url.hostname);
        if (m && m[0]) return m[0];
        else {
            throw new Error(
                `LinkSanitizer: could not determine top level base domain from baseUrl hostname: ${url.hostname}`,
            );
        }
    }

    private prependUnknownProtocolLink(url: string): string {
        // If this link is not relative, http, https, or steem -- add https.
        if (!/^((#)|(\/(?!\/))|(((steem|https?):)?\/\/))/.test(url)) {
            url = "https://" + url;
        }
        return url;
    }

    private isPseudoLocalUrl(url: string, urlTitle: string): boolean {
        if (url.indexOf("#") === 0) return false;
        url = url.toLowerCase();
        urlTitle = urlTitle.toLowerCase();

        try {
            const urlTitleContainsBaseDomain = urlTitle.indexOf(this.topLevelsBaseDomain) !== -1;
            const urlContainsBaseDomain = url.indexOf(this.topLevelsBaseDomain) !== -1;
            if (urlTitleContainsBaseDomain && !urlContainsBaseDomain) {
                return true;
            }
        } catch (error) {
            if (error instanceof TypeError) {
                return false; // if url is invalid it is ok
            } else throw error;
        }
        return false;
    }
}

export namespace LinkSanitizer {
    export interface Options {
        baseUrl: string;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o, "LinkSanitizer.Options", ow.object);
            ow(o.baseUrl, "LinkSanitizer.Options.baseUrl", ow.string.nonEmpty);
        }
    }
}
