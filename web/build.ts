await Bun.build({
    entrypoints: ["./public/index.html"],
    compile: true,
    target: "browser",
    outdir: "./dist",
    plugins: [require("bun-plugin-tailwind")],
});
