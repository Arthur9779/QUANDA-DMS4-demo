import { cp, mkdir } from "node:fs/promises";

await mkdir("public", { recursive: true });
await cp("index.html", "public/quanda.html");
await cp("app.js", "public/app.js");
await cp("original.css", "public/original.css");
await cp("styles.css", "public/styles.css");
await cp("assets", "public/assets", { recursive: true, force: true });
