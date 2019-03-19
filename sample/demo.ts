import SteemContentRenderer from "../dist/index";

const renderer = new SteemContentRenderer({
    baseUrl: "https://steemit.com/",
});

const input = `
# Sample post

and some content
`;

const output = renderer.render(input);

/* tslint:disable no-console */
console.log();
console.log("+-----------------------------+");
console.log("| Steem-content-renderer demo |");
console.log("+-----------------------------+");
console.log();
console.log(output);
console.log();
console.log();
