const SteemContentRenderer = require("../dist/index");

const renderer = new SteemContentRenderer.DefaultRenderer({
    baseUrl: "https://steemit.com/",
    breaks: true,
    skipSanitization: false,
    addNofollowToLinks: true,
    doNotShowImages: false,
    ipfsPrefix: "",
    assetsWidth: 640,
    assetsHeight: 480,
    imageProxyFn: (url) => url,
    usertagUrlFn: (account) => "/@" + account,
    hashtagUrlFn: (hashtag) => "/trending/" + hashtag,
    isLinkSafeFn: (url) => true,
});

const input = `
# Sample post

and some content

Lets mention @ned #stark.
`;

const output = renderer.render(input);

console.log();
console.log("+-----------------------------+");
console.log("| Steem-content-renderer demo |");
console.log("+-----------------------------+");
console.log();
console.log(output);
console.log();
console.log();