# AIGC-Main-Site

## 运行环境

1. Node.js v18.18.2
2. NPM v9.8.1

## 开发说明

本项目为纯CSR，相关信息如下：

| 类型      | 名称        | 版本 |
| --------- | ----------- | :--: |
| 编程语言  | TypeScript  |  5   |
| 界面框架  | React       |  18  |
| 状态管理  | Zustand     |  4   |
| UI框架    | AntD        |  5   |
| 构建工具  | Vite        |  4   |
| CSS预处理 | SASS        |  -   |
| CSS框架   | Tailwindcss |  3   |

## 开发流程

### 安装依赖

推荐使用 yarn

```shell
yarn
```

npm

```shell
npm install
```

pnpm

```shell
pnpm install
```

### 启动 dev server

yarn

```shell
yarn dev:web
```

npm

```shell
npm run dev:web
```

pnpm

```shell
pnpm dev:web
```

Chrome打开 `http://localhost:5173/`

## 开发要求

1. 业务、视图代码TypeScript完全覆盖。
2. React代码开发范式采用 FC+hook。
3. 严格遵循 eslint。
