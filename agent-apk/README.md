# Android Agent APK

此目录存放 Android Agent 的 APK 文件，会被打包到 exe 中。

## 文件说明

- `employee-agent.apk` - Android Agent 应用

## 更新 APK

1. 在 android-agent 项目中编译: `.\gradlew.bat assembleRelease`
2. 将 `app/build/outputs/apk/release/app-release.apk` 复制到此目录
3. 重命名为 `employee-agent.apk`

## 自动化脚本

后续可以添加自动化脚本，在每次编译 exe 前自动更新 APK。
