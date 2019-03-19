import { CustomError } from "universe-log";

export class SecurityChecker {
    public static checkSecurity(text: string) {
        if (this.containsScriptTag(text)) {
            throw new SecurityChecker.SecurityError(
                "Renderer rejected the input because of insecure content: text contains script tag",
            );
        }
    }

    private static containsScriptTag(text: string): boolean {
        return /<\s*script/gi.test(text);
    }
}

export namespace SecurityChecker {
    /* tslint:disable max-classes-per-file */
    export class SecurityError extends CustomError {
        public constructor(message?: string, cause?: Error) {
            super(message, cause);
        }
    }
}
