import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/umd/reflexor.min.js',
            format: 'umd',
            name: 'reflexor',
            sourcemap: true,
        },
        {
            file: 'dist/es/reflexor.min.js',
            format: 'es',
            sourcemap: true,
        },
        {
            file: 'dist/cjs/reflexor.min.js',
            format: 'cjs',
            sourcemap: true,
        },
    ],
    plugins: [
        resolve(), // Resolves node_modules imports
        commonjs(), // Converts CommonJS to ES modules
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false, // Prevent Rollup from emitting declarations
            emitDeclarationOnly: false,
        }),
        terser(), // Minify the output
    ],
};