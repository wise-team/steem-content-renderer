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