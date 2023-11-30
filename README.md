# aiec-electron-vite

## 项目运行

```sh
# install dependency
npm install

# develop
npm run dev

#build
npm run build
```

## 📂 Directory structure

```tree
├── electron                                 Electron-related code
│   ├── main                                 Main-process source code
│   └── preload                              Preload-scripts source code
│
├── release                                  Generated after production build, contains executables
│   └── {version}
│       ├── {os}-{os_arch}                   Contains unpacked application executable
│       └── {app_name}_{version}.{ext}       Installer for the application
│
├── public                                   Static assets
└── src                                      Renderer source code, your React application
```

node 版本

```sh
node 18.16.0
```

