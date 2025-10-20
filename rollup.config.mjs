import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default [
  {
    // New modular entry point
    input: 'src/main.js',
    output: {
      file: 'dist/sidepanel/index.js',
      format: 'iife',
      sourcemap: false
    },
    plugins: [
      nodeResolve({
        jsnext: true,
        main: true,
        browser: true
      }),
      commonjs(),
      copy({
        targets: [
          // Core extension files
          {
            src: ['manifest.json', 'background.js', 'content-extractor.js'],
            dest: 'dist'
          },
          // Static assets
          {
            src: 'images',
            dest: 'dist'
          },
          // UI files
          {
            src: ['sidepanel/index.html', 'sidepanel/index.css'],
            dest: 'dist/sidepanel'
          }
        ]
      })
    ]
  }
];
