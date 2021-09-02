const path = require('path');
const webpack = require('webpack');

function ExportPathedManifest(options) {
    this.options = Object.assign(
        {
            filename: 'pathed.manifest.json',
            map: null,
            filter: null,
            assetFilename: '[name].[hash].[ext]'
        },
        options || {}
    );

    this.assetFilenamePattern = new RegExp(
        '^' +
            this.options.assetFilename
                .replace(/([\\.])/g, '\\$1')
                .replace(/\[(?:name|id)\]/, '(.+)')
                .replace(/\\.(?:\[?\w+\]?$)/, '(\\.\\w+)')
                .replace(/\[[\w:]+\]/g, '.+') +
            '$'
    );
}

ExportPathedManifest.prototype.apply = function (compiler) {
    let options = this.options;
    let assetFilenamePattern = this.assetFilenamePattern;

    if (compiler.hooks) {
        const pluginOptions = {
            name: 'PathedManifestPlugin',
            stage: Infinity
        };

        compiler.hooks.thisCompilation.tap(pluginOptions, function (compilation) {
            compilation.hooks.processAssets.tap(pluginOptions, () => {
                let manifestFiles = [];

                for (let [key, value] of compilation.assetsInfo) {
                    manifestFiles.push({
                        filename: key,
                        pathname:
                            value.sourceFilename ||
                            path.join(
                                path.dirname(key),
                                path.basename(key).replace(assetFilenamePattern, function (fullname, name, ext) {
                                    return name + ext;
                                })
                            )
                    });
                }

                if (options.filter) {
                    manifestFiles = manifestFiles.filter(options.filter);
                }

                if (options.map) {
                    manifestFiles = manifestFiles.map(options.map);
                }

                const manifest = manifestFiles
                    .sort(function (a, b) {
                        return a.pathname > b.pathname ? 1 : -1;
                    })
                    .reduce(function (manifest, item) {
                        manifest[item.pathname] = item.filename;

                        return manifest;
                    }, {});
                const manifestJson = JSON.stringify(manifest, '\n', 2);

                compilation.emitAsset(options.filename, new webpack.sources.RawSource(manifestJson, true));
            });
        });
    } else {
        console.log(
            'The current version is only compatible with webpack@>=4. Please upgrade your webpack or use the < 2.0.0 version.'
        );
    }
};

module.exports = ExportPathedManifest;
