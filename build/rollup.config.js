const util = require("./util");
const typescript = require("rollup-plugin-typescript2");
const babel = require("rollup-plugin-babel");
const commonjs = require("rollup-plugin-commonjs");

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const babelOptions = {
    extensions,
    runtimeHelpers: true,
    presets: [
        [
            "@babel/env",
            {
                modules: false,
                targets: {
                    node: "10.15.3",
                },
            },
        ],
    ],
};

module.exports = {
    input: util.resolve("src/index.ts"),
    output: {
        file: util.resolve("lib/imitate-pool.js"),
        format: "cjs",
    },
    plugins: [
        typescript(),
        commonjs({ extensions, ignore: ["conditional-runtime-dependency"] }),
        babel(babelOptions),
    ],
    external: ["uuid"],
};
