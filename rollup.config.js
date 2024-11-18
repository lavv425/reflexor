import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.ts', // input file
    output: [
        {
            file: 'dist/umd/reflexor.min.js',
            format: 'umd', // Universal Module Definition
            name: 'reflexor', // global name
            sourcemap: true,
        },
        {
            file: 'dist/es/reflexor.min.js',
            format: 'es', // ES module
            sourcemap: true,
        },
        {
            file: 'dist/cjs/reflexor.min.js',
            format: 'cjs', // CommonJS
            sourcemap: true,
        },
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationMap: false,
            declarationDir: 'dist',
            outDir: 'dist',
            rootDir: './src'
        }),
        terser(), // minified UMD version
    ],
};