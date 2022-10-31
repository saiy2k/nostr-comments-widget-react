import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";
import json from 'rollup-plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';

//import { terser } from "rollup-plugin-terser";
import peerDepsExternal from 'rollup-plugin-peer-deps-external';


// const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/cjs/index.js",
        format: "cjs",
        sourcemap: false,
      },
      {
        file: "dist/esm/index.js",
        format: "esm",
        sourcemap: false,
      },
    ],
    plugins: [
      peerDepsExternal(),

      resolve({ 
        preferBuiltins: false 
      }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss(),
      json(),

      nodePolyfills(),
    ],
  },
  {
    input: "dist/esm/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
