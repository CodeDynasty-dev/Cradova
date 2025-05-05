const res = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "./dist",
  // outdir: "./tests/dist",
  target: "node",
  format: "esm",
  // minify: true,
});
if (!res.success) {
  console.log(...res.logs);
} else {
  Bun.spawn(["./pack"]);
}
