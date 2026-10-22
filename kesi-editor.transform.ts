/**
 * KESI 编辑器编译期转换（无需安装任何 npm 包）。
 *
 * vite 编译 src/pages 下的 TSX 时，回调 Go 服务 /apps/editor/transform，
 * 由 Go 侧 AST 为每个 JSX 元素注入 data-node-id（元素在源码中的位置编码），
 * 浏览器 DOM 据此支持点选编辑。逻辑全部在服务端，本文件只做转发。
 *
 * 环境变量（由 KESI 平台启动 dev server 时注入；缺失时回落到脚手架写入的
 * 网关地址，两者都没有则跳过，不影响普通开发）：
 *   KESI_EDITOR_SERVER  Go 服务直连地址（如 http://127.0.0.1:3001）
 *   KESI_EDITOR_PROJECT 项目 backendID
 *   KESI_EDITOR_ROUTE   项目 route
 */
const SERVER_URL = "__SERVER_URL__"

// 直连 Go：/apps/editor/transform；经网关：/rest/apps/editor/transform
function transformUrl(server: string, route: string) {
  const base = server.replace(/\/+$/, "")
  const prefix = process.env.KESI_EDITOR_SERVER ? "/apps" : "/rest/apps"
  return `${base}${prefix}/editor/transform?route=${encodeURIComponent(route)}`
}

export function kesiEditorTransform() {
  return {
    name: "kesi-editor-transform",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      const direct = process.env.KESI_EDITOR_SERVER
      const server = direct || (SERVER_URL.startsWith("__") ? "" : SERVER_URL)
      if (!server) return // 未接入平台（模板单独开发）：跳过
      const project = process.env.KESI_EDITOR_PROJECT || "default"
      const route = process.env.KESI_EDITOR_ROUTE || ""
      if (!route) return
      const file = id.split("?")[0] // 剥掉 HMR 时间戳等 query
      if (!file.includes("/src/pages/") || !/\.tsx?$/.test(file)) return
      if (file.includes("node_modules")) return

      return fetch(transformUrl(server, route), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-project": project,
        },
        body: JSON.stringify({ file, source: code }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => (res ? { code: res.code, map: null } : null))
        .catch(() => null) // 服务不可达：静默跳过，返回原代码
    },
  }
}
