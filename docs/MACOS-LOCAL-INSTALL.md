# macOS 本机安装

本分支修复了源码在 macOS 上的依赖、音频线程、Whisper API、应用图标、麦克风用途说明及事件权限问题。Gemma 3 使用支持该模型的 llama-cpp-2；生成的中文按完整 UTF-8 字节序列解码。

## 编译和安装

需要 Rust、Node.js 20+、pnpm、CMake 和 Xcode 命令行工具。

```sh
pnpm install --frozen-lockfile
./scripts/download-models.sh
pnpm tauri build --bundles app
codesign --force --deep --sign - src-tauri/target/release/bundle/macos/LocalWhisper.app
mkdir -p "$HOME/Applications" "$HOME/Library/Application Support/localwhisper/models"
cp -R src-tauri/target/release/bundle/macos/LocalWhisper.app "$HOME/Applications/"
cp src-tauri/models/*.bin src-tauri/models/*.gguf "$HOME/Library/Application Support/localwhisper/models/"
open "$HOME/Applications/LocalWhisper.app"
```

模型合计约 2.43 GB。正式构建从应用数据目录读取模型，开发构建可从源码的 models 目录读取。

## 使用

1. 按向导加载模型。
2. 首次录音时允许麦克风。到「系统设置 → 隐私与安全性 → 辅助功能」启用 LocalWhisper，以便向其他应用输入文字。
3. 在目标输入框中按住 `⌘ + ⇧ + Space` 说话，松开后转写。
4. 关闭窗口会隐藏到菜单栏；从菜单栏选择 Quit LocalWhisper 可完全退出。

默认关闭可选的 AI 润色。实际测试中，Gemma 3 1B 可生成合法中文，但可能省略时间等原意；需要时可在设置中自行开启。语音识别和模型推理均在本机进行。当前构建未进行 GPU 性能优化。

本地签名用于本机试用，没有进行 Apple 公证。真实麦克风和跨应用输入需要使用者完成 macOS 授权后验证。
