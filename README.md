# 敲门砖

本地求职小工具，无需模型配置。

## 两个页面

默认首页为简历文档堆叠，点击文档进入编辑，支持版本保存、差异对比与 PDF 预览（需 XeLaTeX）。

顶部保留品牌和简历 PDF 导出。导出前需保存修改；多份简历可选择导出对象。点击右侧「去求职」区域，页面横向切换；点击左侧「菜就多练」返回。支持点击和键盘操作，切换保留编辑草稿。求职页当前留白，原有企业、招聘和面试数据保留。

## 本地运行

需要 Node.js 22.13+。

```sh
git clone git@github.com:koyama-kagami/qiaomenzhuan.git
cd qiaomenzhuan
npm install
npm run build
npm start
```

地址为 `http://127.0.0.1:4317`。数据保存在项目的 `workspace/`，不需要数据库。顶部按钮可刷新或导出数据。

开发模式：`npm run dev`。指定目录和端口：

```sh
npm start -- --workspace ./my-career --port 4318
```

自定义资料目录请加入 Git 忽略。服务只监听本机。

## 验证

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

测试使用临时数据，不调用真实模型。历史笔记与 CLI 接口保留兼容，Web 界面仅提供简历和求职两个页面，不包含模型设置、模拟出题或 AI 修改。
