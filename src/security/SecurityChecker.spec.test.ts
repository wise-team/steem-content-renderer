import { expect } from "chai";
import "mocha";

import { SecurityChecker } from "./SecurityChecker";

describe("SecurityChecker", () => {
    describe("checkSecurity", () => {
        describe("props.allowScriptTag = false", () => {
            const opts = { allowScriptTag: false };

            it("Throws when contains script tag", () => {
                expect(() => SecurityChecker.checkSecurity("<script src=", opts)).to.throw(
                    /insecure content/,
                );
            });

            it("Does not throw when no script tag", () => {
                SecurityChecker.checkSecurity("<p></p>", opts);
            });
        });

        describe("props.allowScriptTag = true", () => {
            const opts = { allowScriptTag: true };

            it("Does not throw when script tag", () => {
                SecurityChecker.checkSecurity("<script src=", opts);
            });

            it("Does not throw when no script tag", () => {
                SecurityChecker.checkSecurity("<p></p>", opts);
            });
        });
    });
});
