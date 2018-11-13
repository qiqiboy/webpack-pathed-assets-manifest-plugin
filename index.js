const path = require('path');

function ExportPathedManifest(options) {
    this.options = Object.assign(
        {
            filename: 'pathed.manifest.json',
            map: null,
            filter: null
        },
        options || {}
    );
}

function transform(filename) {
    const pips = filename.split('.');

    pips.splice(-2, 1);

    return pips.join('.');
}

ExportPathedManifest.prototype.apply = function(compiler) {
    let options = this.options;
    let manifestFiles = [];

    if (compiler.hooks) {
        const pluginOptions = {
            name: 'PathedManifestPlugin',
            stage: Infinity
        };
        const SyncWaterfallHook = require('tapable').SyncWaterfallHook;

        compiler.hooks.webpackManifestPluginAfterEmit = new SyncWaterfallHook(['manifest']);

        compiler.hooks.compilation.tap(pluginOptions, function(compilation) {
            compilation.hooks.moduleAsset.tap(pluginOptions, function(module, filename, c) {
                let fileDependencies = Array.from(module.buildInfo.fileDependencies);
                let mayFile = fileDependencies.find(function(file) {
                    return path.basename(file) === transform(path.basename(filename));
                });

                manifestFiles.push({
                    filename: filename,
                    pathname: mayFile || module.userRequest
                });
            });
        });

        compiler.hooks.emit.tap(pluginOptions, function(compilation, compileCallback) {
            if (options.filter) {
                manifestFiles = manifestFiles.filter(options.filter);
            }

            if (options.map) {
                manifestFiles = manifestFiles.map(options.map);
            }

            const manifest = manifestFiles
                .sort(function(a, b) {
                    return a.pathname > b.pathname ? 1 : -1;
                })
                .reduce(function(manifest, item) {
                    manifest[item.pathname] = item.filename;
                    return manifest;
                }, {});
            const manifestJson = JSON.stringify(manifest, '\n', 2);

            compilation.assets[options.filename] = {
                source: function() {
                    return manifestJson;
                },
                size: function() {
                    return manifestJson.length;
                }
            };

            compiler.hooks.webpackManifestPluginAfterEmit.call(manifest);
        });
    } else {
        console.log(
            'The current version is only compatible with webpack@4. Please upgrade your webpack or use the < 2.0.0 version.'
        );
    }
};

module.exports = ExportPathedManifest;
