# steem-content-renderer
[![npm](https://img.shields.io/npm/v/steem-content-renderer.svg?style=flat-square)](https://www.npmjs.com/package/steem-content-renderer) [![License](https://img.shields.io/github/license/wise-team/steem-content-renderer.svg?style=flat-square)](https://github.com/wise-team/steem-content-renderer/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![Chat](https://img.shields.io/badge/chat%20on%20discord-6b11ff.svg?style=flat-square)](https://discordapp.com/invite/CwxQDbG)

👉 **[Online demo](https://wise-team.github.io/steem-content-renderer/sample/live-demo.html)**

Portable library that renders steem posts and comments to string. It supports markdown and html and mimics the behaviour of condenser frontend.

Features:

-   supports markdown and html

-   sanitizes html and protects from XSS

**Credit**: this library is based on the code from condenser. It's aim is to allow other projects display steem content the right way without porting the same code over and over.


## Server side usage

Installation:
```bash
$ npm install --save steem-content-renderer
```

**Typescript:**

```typescript
import { DefaultRenderer } from "steem-content-renderer";

const renderer = new DefaultRenderer({
    baseUrl: "https://steemit.com/",
    breaks: true,
    skipSanitization: false,
    addNofollowToLinks: true,
    doNotShowImages: false,
    ipfsPrefix: "",
    assetsWidth: 640,
    assetsHeight: 480,
    imageProxyFn: (url: string) => url,
    usertagUrlFn: (account: string) => "/@" + account,
    hashtagUrlFn: (hashtag: string) => "/trending/" + hashtag,
    isLinkSafeFn: (url: string) => true,
});

const safeHtmlStr = renderer.render(postContent);
```

## Browser usage:
See [demo](https://wise-team.github.io/steem-content-renderer/sample/live-demo.html) and (its source)[https://github.com/wise-team/steem-content-renderer/blob/master/sample/live-demo.html].

```html
        <script src="https://unpkg.com/steem-content-renderer"></script>
        <script>
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

            $(document).ready(() => {
                const renderMarkdownBtnElem = $("#render-button");
                const inputElem = $("#input");
                const outputElem = $("#output");
                const outputMarkupElem = $("#output-markup");

                renderMarkdownBtnElem.on("click", () => {
                    const input = inputElem.val();
                    const output = renderer.render(input);
                    
                    console.log("Rendered", output);
                    outputElem.html(output);
                    outputMarkupElem.text(output);
                });
            });
        </script>
    </body>
</html>
```