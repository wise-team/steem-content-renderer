// tslint:disable no-console max-line-length quotemark

import { expect } from "chai";
import { JSDOM } from "jsdom";
import "mocha";

// import * as example1 from "./_test/example1.mock.test";
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
        usertagUrlFn: (account: string) => `/@${account}`,
        hashtagUrlFn: (hashtag: string) => `/trending/${hashtag}`,
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
            name: "Renders steem mentions correctly",
            raw: "Content @noisy another content",
            expected: '<p>Content <a href="/@noisy">@noisy</a> another content</p>',
        },
        {
            name: "Renders steem hashtags correctly",
            raw: "Content #pl-nuda another content",
            expected: '<p>Content <a href="/trending/pl-nuda">#pl-nuda</a> another content</p>',
        },
        {
            name: "Embeds correctly vimeo video via paste",
            raw:
                '<iframe src="https://player.vimeo.com/video/174544848?byline=0" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>',
            expected:
                '<div class="videoWrapper"><iframe frameborder="0" allowfullscreen="allowfullscreen" webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" src="https://player.vimeo.com/video/174544848" width="640" height="480"></iframe></div>',
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
