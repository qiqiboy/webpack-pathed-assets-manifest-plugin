# webpack-pathed-assets-manifest-plugin

> `v2.0`及以上版本仅支持`webpack@4`。如果你在使用`webpack@3`，请使用 1.x 版本代替：`npm install webpack-pathed-assets-manifest-plugin@1`

创建资源清单文件，使用他们的路径当作 key，以方便 server-render 项目映射资源文件路径到打包后的文件。

注：该插件无法替代 webpack-manifest-plugin。它仅仅处理入口文件中 require 的资源文件，例如图片等。

### 解决的问题

如下文件结构，模块 A 和 B 下的出现了名称同为 logo.png 的不同图片文件：

```
    app/
    |- /A
      |- index.js
      |- logo.png
      |- title.png
    |- /B
      |- index.js
      |- logo.png
```

我们使用 `webpack-manifest-plugin` 这种插件，生成的清单文件，会类似：

```js
{
    "logo.png": "logo.d5ae6b8d.png",
    "title.png": "title.531a2154.png"
}
```

很明显可以看出，少了个 logo.png 文件的记录。也就是说，不同模块下的同名文件，在清单文件中会相互覆盖，导致生成的清单文件有丢失文件记录。

而通过本插件，可以生成：

```js
{
    "app/A/logo.png": "logo.d5ae6b8d.png",
    "app/A/title.png": "title.531a2154.png",
    "app/B/logo.png": "logo.423a075.png"
}
```

完美保留了所有的文件索引。

### 安装

```bash
npm install --save-dev webpack-pathed-assets-manifest-plugin
```

### 使用

```js
var PathedManifestPlugin = require('webpack-pathed-assets-manifest-plugin');

module.exports = {
    // ...
    plugins: [
        new PathedManifestPlugin({
            filename: 'pathed.manifest.json',
            map: null, // 可以传function，自定义filename和pathname，默认pathname为绝对路径
            filter: null, // 可以传function，自定义过滤的文件
            assetFilename: '[name].[hash].[ext]' // 静态文件的命名模版，默认为文件后缀前是hash值，如果你的文件命名规则不是这样，可以修改该模板。例如：asset-[name].[hash:8].[ext]
        })
    ]
};
```

默认生成的清单文件，是以绝对路径作为 key。推荐使用以下配置：

```js
var path = require('path');

new PathedManifestPlugin({
    map: function(file) {
        return {
            filename: file.filename,
            pathname: path.relative(root /* your project root */, file.pathname)
        };
    }
});
```
