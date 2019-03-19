const SteemContentRenderer = require("../dist/index");

const renderer = new SteemContentRenderer.DefaultRenderer({
    baseUrl: "https://steemit.com/"
});

const input = `
# Sample post

and some content
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