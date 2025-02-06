## about
- 此静态模板旨在于桌面脱联机chrome中通览常见的媒体文件(超文本, pdf, 音视频, 图册, txt)
- 线下清晰快速地组织文件, 线上经github,dropbox推送存盘
- by [ida](mailto:futarinoida@gmail.com)


## 检索框
- 索引元数据由`gen.jar`抓取, 包含文件名, 类型, 目录层级, html页面正文, 同时覆写`side.html`, 在`config.properties`中指定要排除的页面
- 检索框内即时输入即时匹配, 不同文件类型区别着色
	- 对于html结果点按后打开页面同时定位到第一处高亮, 关键词高亮时代码着色不可用, destroy取消高亮恢复代码着色, 根据页面h标签自动创建内文目录
	- 对于其它媒体结果点按即播放
- 按日期检索时, 例如查找2024年1月份更新过的页面, 则可输入`202401`或更短的`2401`, html页面时间戳和img下图片名按格式`yyyymmddhhmmss`

## txt
- 支持页面划选摘记, 复划取消摘记, 拼接后的摘记存于右下角`txt_notes`文本框, 连同阅读位置由localstorage存储与恢复


## 双语行对齐
- 开启后, 单击一次换行一次, 由localstorage存储与恢复, 即阅即修(注意覆盖)


## pdf横向阅读器
- 入口链接位于右栏jump中, 适合浏览如playboy彩页对开的pdf期刊, 中击全屏, 可颜色反转


## 音频
- 支持单全随机或目录循环, fav标记, 由localstorage存储与恢复


## 图册
- 支持拖曳和滚轮缩放, 图片自身描述


## 文件组织
- audio, pdf, video, gallery, txt目录下存放对应类型的文件(文件名带emoji时dropbox无法同步), 最多两级子类, 其层级结构映射于右栏导航页面, 无所属的自动划入未分类
	- gallery中bg目录下的图片作为首页的随机背景图来源
	- txt中最终文件类型为html, `gen.jar`会遍历覆写此目录下的txt文件, 开头植入脚本同时变更后缀
- html存放单体文件, 头部固定引用content脚本及样式, 正文固定于首个`pre`标签内, 代码固定于`code`标签内(祼属性名直接指明目标语言类型), 按行首缩进(x4空格数)自动套用样式, 14位数字加图片类型后缀自动创建`img`标签(关联img目录下的图片), 纯文本网址自动创建`a`标签, `p`标签自动转表格(冒号作为列分隔), 尽可能减少标签书写
- img中存放单体文件
- src中存放配置文件, 错误日志, jar包及源码, 触发脚本, 协议注册表, 基础html
	- new.bat用于命令行交互创建新html页面, 输入文件名和分类, 参数传递给new.jar, 新文件输出到html目录, 随即以vscode打开该文件
	- webp.bat用于一键转webp格式, 将指定目录下的原始图片批量转webp格式输出到img目录, 同时以yyyymmddhhmmss格式重命名, 并将新文件名复制到剪贴板, 在config中指定转换质量和源目录
	- gen.bat用于一键生成索引元数据和随机背景图列表, 以及查找和处理txt文件, 遇错自行打开err.log
	- push.bat用于批量执行git指令
- html页面左上角edit点按经本地url协议调用`guide.bat`, 执行`stamp.jar`更新本地html中的时间戳, 随即以vscode打开该文件, 双击右上角标题重载页面


## 复用前提
- 安装java环境, 配置config, 创建本地url协议
- 重命名首页title
- 在audio, gallery, html, img, pdf, txt, video下放入对应类型的文件
- 执行gen.bat


## 辅助工具
- 指定区域转pdf文档, `chrome://extensions/?id=fgbhbfdgdlojklkbhdoilkdlomoilbpl`
- `strokelt`鼠标手势, 模仿组合击键
- `sunta2`浮动截图, 配合strokelt
- `clibor`文字剪贴板, 配合strokelt
- `everything`文件搜索
- `Moo0`录音
- 黄狗五笔自定词zz输出当前14位数字时间串, `$ddcmd(<date.yyyy><date.mm><date.dd><time.hh><time.mm><time.ss>)`