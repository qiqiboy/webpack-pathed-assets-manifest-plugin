# webpack-pathed-assets-manifest-plugin
创建资源清单文件，使用他们的路径当作key，以方便server-render项目映射资源文件路径到打包后的文件。

注：该插件无法替代webpack-manifest-plugin。它仅仅处理入口文件中 require 的资源文件，例如图片等。

### 解决的问题
我们使用 `webpack-manifest-plugin` 这种插件，生成的清单文件，类似：
```json
{
    "logo.png": "logo.xxxxxx.png",
    "title.png": "title.xxxxxx.png"
}
```

这种存在的问题是，不同路径下同名文件会相互覆盖，导致生成的清单文件中缺少重复的项目。  

通过本插件，可以生成：
```json
{
    "logos/logo.png": "logo.xxxxxx.png",
    "about/titles/title.png": "title.xxxxxx.png"
}
```

### 安装
```bash
npm install --save-dev webpack-pathed-assets-manifest-plugin
```

### 使用
```javascript
var PathedManifestPlugin = require('webpack-pathed-assets-manifest-plugin');

module.exports = {
    // ...
    plugins: [
        new PathedManifestPlugin({
            filename: 'pathed.manifest.json',
            map: null, // 可以传function，自定义filename和pathname，默认pathname为绝对路径
            filter: null // 可以传function，自定义过滤的文件
        })
    ]
}
```

默认生成的清单文件，是以绝对路径作为key。推荐使用以下配置：
```javascript
var path = require('path');

new PathedManifestPlugin({
    map: function(file) {
    return {
        filename: file.filename,
        pathname: path.relative(/* your project root */, file.pathname)
    }
})
```
