// tslint:disable max-line-length quotemark

import { expect } from "chai";
import { JSDOM } from "jsdom";
import "mocha";

import { Log } from "../../Log";

import { DefaultRenderer } from "./DefaultRenderer";

describe("DefaultRender", () => {
    const defaultOptions: DefaultRenderer.Options = {
        baseUrl: "https://steemit.com/",
        breaks: true,
        skipSanitization: false,
        addNofollowToLinks: true,
        doNotShowImages: false,
        ipfsPrefix: "",
        assetsWidth: 640,
        assetsHeight: 480,
        imageProxyFn: (url: string) => url,
        usertagUrlFn: (account: string) => `https://steemit.com/@${account}`,
        hashtagUrlFn: (hashtag: string) => `/trending/${hashtag}`,
        isLinkSafeFn: (url: string) => true, // !!url.match(/^(\/(?!\/)|https:\/\/steemit.com)/),
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
            expected: '<p>Content <a href="https://steemit.com/@noisy">@noisy</a> another content</p>',
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
        {
            name: "Embeds correctly youtube video via paste",
            raw:
                '<iframe width="560" height="315" src="https://www.youtube.com/embed/0nFkmd-A7jA" frameborder="0" allowfullscreen></iframe>',
            expected:
                '<div class="videoWrapper"><iframe width="640" height="480" src="https://www.youtube.com/embed/0nFkmd-A7jA" allowfullscreen="allowfullscreen" webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" frameborder="0"></iframe></div>',
        },
        {
            name: "Embeds correctly youtube video via youtube.com link",
            raw: "https://www.youtube.com/embed/0nFkmd-A7jA",
            expected:
                '<p><div class="videoWrapper"><iframe width="640" height="480" src="https://www.youtube.com/embed/0nFkmd-A7jA" allowfullscreen="allowfullscreen" webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" frameborder="0"></iframe></div></p>',
        },
        {
            name: "Embeds correctly youtube video via youtu.be link",
            raw: "https://www.youtu.be/0nFkmd-A7jA",
            expected:
                '<p><div class="videoWrapper"><iframe width="640" height="480" src="https://www.youtube.com/embed/0nFkmd-A7jA" allowfullscreen="allowfullscreen" webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" frameborder="0"></iframe></div></p>',
        },
        {
            name: "Allows links embedded via <a> tags",
            raw: "<a href='https://steemit.com/utopian-io/@blockchainstudio/drugswars-revenue-and-transaction-analysis'>Drugwars - revenue and transaction analysis</a>",
            expected: '<p><a href="https://steemit.com/utopian-io/@blockchainstudio/drugswars-revenue-and-transaction-analysis">Drugwars - revenue and transaction analysis</a></p>',
        },

        {
            name: "Allows links embedded via <a> tags inside of markdown headers",
            raw: "## <a href='https://steemit.com/utopian-io/@blockchainstudio/drugswars-revenue-and-transaction-analysis'>Drugwars - revenue and transaction analysis</a>",
            expected: '<h2><a href="https://steemit.com/utopian-io/@blockchainstudio/drugswars-revenue-and-transaction-analysis">Drugwars - revenue and transaction analysis</a></h2>',
        },
    ];

    tests.forEach(test =>
        it(test.name, () => {
            const renderer = new DefaultRenderer(defaultOptions);
            const rendered = renderer.render(test.raw).trim();

            const renderedNode = JSDOM.fragment(rendered);
            const comparisonNode = JSDOM.fragment(test.expected);

            Log.log().debug("rendered", rendered);
            Log.log().debug("expected", test.expected);

            expect(renderedNode.isEqualNode(comparisonNode)).to.be.equal(true);
        }),
    );
});
