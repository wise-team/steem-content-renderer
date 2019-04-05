// tslint:disable no-console

import { expect } from "chai";
import { JSDOM } from "jsdom";
import "mocha";

import * as example1 from "./_test/example1.mock.test";
import { DefaultRenderer } from "./DefaultRenderer";

describe("DefaultRender", () => {
    const defaultOptions: DefaultRenderer.Options = {
        breaks: true,
        skipSanitization: false,
        addNofollowToLinks: true,
        doNotShowImages: false,
        ipfsPrefix: "",
        assetsWidth: 640,
        assetsHeight: 480,
        imageProxyFn: (url: string) => url,
    };

    const tests = [
        { name: "Renders H1 headers correctly", raw: `# Header H1`, expected: "<h1>Header H1</h1>" },
        { name: "Renders H4 headers correctly", raw: `#### Header H4`, expected: "<h4>Header H4</h4>" },
        {
            name: "Renders headers and paragraphs correctly",
            raw: "# Header H1\n\nSome paragraph\n\n## Header H2\n\nAnother paragraph",
            expected: "<h1>Header H1</h1>\n<p>Some paragraph</p>\n<h2>Header H2</h2>\n<p>Another paragraph</p>",
        },
        {
            name: "Renders steemit mentions correctly",
            raw: "@noisy",
            expected: "<h1>Header H1</h1>\n<p>Some paragraph</p>\n<h2>Header H2</h2>\n<p>Another paragraph</p>",
        },
    ];

    tests.forEach(test =>
        it(test.name, () => {
            const renderer = new DefaultRenderer(defaultOptions);
            const rendered = renderer.render(test.raw).trim();

            console.log("=========== RENDERED ============");
            console.log(rendered);
            console.log();

            console.log("=========== EXPECTED ============");
            console.log(test.expected);
            console.log();

            const renderedNode = JSDOM.fragment(rendered);
            const comparisonNode = JSDOM.fragment(test.expected);
            expect(renderedNode.isEqualNode(comparisonNode)).to.be.equal(true);
        }),
    );
});
