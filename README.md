# steem-content-renderer

Portable library that renders steem posts and comments to string. It supports markdown and html and mimics the behaviour of condenser frontend.

Features:

-   supports markdown and html

-   sanitizes html and protects from XSS

**Credit**: this library is based on the code from condenser. It's aim is to allow other projects display steem content the right way without porting the same code over and over.

### Install

```bash
$ npm install --save steem-content-renderer
```

### Use in your project (typescript)

**Typescript:**

```typescript
import { SteemContentRenderer } from "steem-content-renderer";

const renderer = new SteemContentRenderer({
    breaks: true,
    skipSanitization: false,
    addNofollowToLinks: true,
    doNotShowImages: false,
    ipfsPrefix: "",
    assetsWidth: 640,
    assetsHeight: 480,
    imageProxyFn: (url: string) => url,
});

const safeHtmlStr = renderer.render(postContent);
```
