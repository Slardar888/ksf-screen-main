import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MachineProvider } from "@/store";

import LoginPage from "./pages/LoginPage";
import NodeIdProbe from "./pages/__NodeIdProbe";
import MainMenuPage from "./pages/MainMenuPage";
import OperationScreenPage from "./pages/OperationScreenPage";
import InjectionSetupPage from "./pages/InjectionSetupPage";
import TempSetupPage from "./pages/TempSetupPage";
import PresetCountPage from "./pages/PresetCountPage";
import JointDetectPage from "./pages/JointDetectPage";
import PumpCleanPage from "./pages/PumpCleanPage";
import SuperUserPage from "./pages/SuperUserPage";
import SystemAdminPage from "./pages/SystemAdminPage";
import BindingCardPage from "./pages/BindingCardPage";
import AngleMonitorPage from "./pages/AngleMonitorPage";
import MesSchedulePage from "./pages/MesSchedulePage";
import IoMonitorPage from "./pages/IoMonitorPage";
import { ROUTES } from "@/components/hmi/shared";
import { isAuthed } from "@/lib/auth";

/** 主菜单的 hash 路径（与原系统保持一致，保留中文段） */
export const HOME = ROUTES.home;

/** 未登录访问业务页面时统一回登录页 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) return <Navigate to={ROUTES.login} replace />;
  return <>{children}</>;
}

function IndexRedirect() {
  return <Navigate to={isAuthed() ? HOME : ROUTES.login} replace />;
}

/** 兜底：未登记的路径回主菜单 */
function Fallback() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname === "") return <IndexRedirect />;
  return <Navigate to={HOME} replace />;
}

export default function App() {
  return (
    <HashRouter>
      <MachineProvider>
        <Routes>
          <Route path="/" element={<IndexRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          {/*
            data-node-id 透传探针（仅开发环境注册）：
            逐一点渲染所有 hmi 图元并断言属性落在 render 的第一个 DOM 元素上。
            由 .workbuddy/node-id.mjs 复测，生产构建里这条路由不存在。
          */}
          {import.meta.env.DEV && (
            <Route path="/__nodeid-probe" element={<NodeIdProbe />} />
          )}

          <Route path="/app/主菜单" element={<RequireAuth><MainMenuPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/操作画面" element={<RequireAuth><OperationScreenPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/注料设置" element={<RequireAuth><InjectionSetupPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/温度设定" element={<RequireAuth><TempSetupPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/预置计数" element={<RequireAuth><PresetCountPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/接头检测" element={<RequireAuth><JointDetectPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/料泵清洗" element={<RequireAuth><PumpCleanPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/超级管理员调试" element={<RequireAuth><SuperUserPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/系统管理员" element={<RequireAuth><SystemAdminPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/绑卡设置" element={<RequireAuth><BindingCardPage /></RequireAuth>} />
          <Route path="/app/报警弹窗/角度监控" element={<RequireAuth><AngleMonitorPage /></RequireAuth>} />

          <Route path="/dashboard/mes/view" element={<RequireAuth><MesSchedulePage /></RequireAuth>} />
          <Route path="/dashboard/io/view" element={<RequireAuth><IoMonitorPage /></RequireAuth>} />

          <Route path="*" element={<Fallback />} />
        </Routes>
      </MachineProvider>
    </HashRouter>
  );
}
