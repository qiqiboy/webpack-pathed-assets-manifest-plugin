function ExportPathedManifest(options) {
    this.options = extend(
        {
            filename: 'pathed.manifest.json',
            map: null,
            filter: null
        },
        options || {}
    );
}

ExportPathedManifest.prototype.apply = function(compiler) {
    var options = this.options;
    var manifestFiles = [];

    compiler.plugin('compilation', function(compilation) {
        compilation.plugin('module-asset', function(module, filename) {
            manifestFiles.push({
                filename: filename,
                pathname: module.userRequest
            });
        });
    });

    compiler.plugin('emit', function(compilation, compileCallback) {
        if (options.filter) {
            manifestFiles = manifestFiles.filter(options.filter);
        }

        if (options.map) {
            manifestFiles = manifestFiles.map(options.map);
        }

        var manifest = manifestFiles.reduce(function(manifest, item) {
            manifest[item.pathname] = item.filename;
            return manifest;
        }, {});
        var manifestJson = JSON.stringify(manifest, '\n', 2);

        compilation.assets[options.filename] = {
            source: function() {
                return manifestJson;
            },
            size: function() {
                return manifestJson.length;
            }
        };

        compileCallback();
    });
};

function extend(base) {
    var i = 1;
    var len = arguments.length;

    for (; i < len; i++) {
        var obj = arguments[i];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                base[key] = obj[key];
            }
        }
    }

    return base;
}

module.exports = ExportPathedManifest;
