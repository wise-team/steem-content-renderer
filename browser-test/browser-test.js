import {ClientFunction, Selector} from 'testcafe';

fixture`Getting Started`
	.page`./index.html`;

const defaultOptions = {
    baseUrl: "https://steemit.com/",
    breaks: true,
    skipSanitization: false,
    allowInsecureScriptTags: false,
    addNofollowToLinks: true,
    doNotShowImages: false,
    ipfsPrefix: "",
    assetsWidth: 640,
    assetsHeight: 480,
    imageProxyFn: (url) => url,
    usertagUrlFn: (account) => `https://steemit.com/@${account}`,
    hashtagUrlFn: (hashtag) => `/trending/${hashtag}`,
    isLinkSafeFn: (url) => true, // !!url.match(/^(\/(?!\/)|https:\/\/steemit.com)/),
};

const renderInBrowser = ClientFunction((options, markup) => {
    const renderer = new SteemContentRenderer.DefaultRenderer(options);
    return renderer.render(markup);
});

test('Renders properly simple markup', async t => {
    const markup = "# H1"

    await t.click(Selector('#awaiter'))
    .expect(renderInBrowser({ ...defaultOptions }, markup)).eql('<h1>H1</h1>\n');
});

test('Does not crash on mixed-img markup', async t => {
    const markup = `<img src="![Sacrifice The Truth Logo.jpg](https://cdn.steemitimages.com/DQmUjNstssuPJpjPDDWfRnw1x2tY6AWWKcajDMGpPLA5iJf/Sacrifice%20The%20Truth%20Logo.jpg)"/>`;
    const expected = `<p><img src="brokenimg.jpg" /></p>\n`;

    await t.click(Selector('#awaiter'))
    .expect(renderInBrowser({ ...defaultOptions }, markup)).eql(expected);
});