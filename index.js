const path = require('path');

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
    let manifestFiles = [];

    if (compiler.hooks) {
        const pluginOptions = {
            name: 'PathedManifestPlugin',
            stage: Infinity
        };

        compiler.hooks.compilation.tap(pluginOptions, function (compilation) {
            compilation.hooks.moduleAsset.tap(pluginOptions, function (module, filename, c) {
                let beforeHashName = path
                    .basename(filename)
                    .replace(assetFilenamePattern, function (fullname, name, ext) {
                        return name + ext;
                    });
                let fileDependencies = Array.from(module.buildInfo.fileDependencies);
                let mayFile = fileDependencies.find(function (file) {
                    return path.basename(file) === beforeHashName;
                });

                manifestFiles.push({
                    filename: filename,
                    pathname: mayFile || module.userRequest
                });
            });

            compilation.hooks.chunkAsset.tap(pluginOptions, function (chunk, filename, c) {
                let beforeHashName = path
                    .basename(filename)
                    .replace(assetFilenamePattern, function (fullname, name, ext) {
                        return name + ext;
                    });

                manifestFiles.push({
                    filename: filename,
                    pathname: path.join(path.dirname(filename), beforeHashName)
                });
            });
        });

        compiler.hooks.emit.tapPromise(pluginOptions, function (compilation) {
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

            compilation.assets[options.filename] = {
                source: function () {
                    return manifestJson;
                },
                size: function () {
                    return manifestJson.length;
                }
            };

            manifestFiles.length = 0;

            return Promise.resolve();
        });
    } else {
        console.log(
            'The current version is only compatible with webpack@4. Please upgrade your webpack or use the < 2.0.0 version.'
        );
    }
};

module.exports = ExportPathedManifest;
