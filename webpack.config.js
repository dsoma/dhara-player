import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
//import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, 'src');
const outputDir = path.resolve(__dirname, 'dist');
const demoDir = path.resolve(__dirname, 'demo');

export default (options) => {
    const isProduction = options.mode === 'production';
    const sourceMapType = isProduction ? 'hidden-source-map' : 'inline-source-map';

    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            dharaplayer: path.resolve(srcDir, 'index.ts'),
        },
        output: {
            filename: '[name].js',
            path: outputDir,
            clean: true,
        },
        devtool: sourceMapType,
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    include: [srcDir],
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Dhara Player',
                filename: 'index.html',
                template: path.resolve(demoDir, 'index-template.html'),
                scriptLoading: 'blocking',
                inject: 'head'
            }),

            new CopyPlugin({
                patterns: [
                    {
                        from: '**/*.png',
                        context: demoDir,
                        to: outputDir,
                    },
                    {
                        from: path.resolve(demoDir, 'playerdemo.js'),
                        to: path.resolve(outputDir, 'playerdemo.js')
                    }
                ],
            }),

            // new BundleAnalyzerPlugin(),
        ],
        devServer: {
            static: [{
                directory: outputDir,
            }],
            compress: true,
            port: 9000,
            hot: true,
            open: {
                target: ['index.html'],
            },
        }
    };
}
