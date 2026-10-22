import { useNavigate } from "react-router-dom";
import { HmiButton, type Passthrough } from "@/components/hmi/primitives";

/* ------------------------------------------------------------------ *
 * 全站路由表（路径沿用原站中文 hash 段）
 * ------------------------------------------------------------------ */
export const ROUTES = {
  login: "/login",
  home: "/app/%E4%B8%BB%E8%8F%9C%E5%8D%95",
  operation: "/app/报警弹窗/操作画面",
  injection: "/app/报警弹窗/注料设置",
  temp: "/app/报警弹窗/温度设定",
  preset: "/app/报警弹窗/预置计数",
  joint: "/app/报警弹窗/接头检测",
  pumpClean: "/app/报警弹窗/料泵清洗",
  superUser: "/app/报警弹窗/超级管理员调试",
  sysAdmin: "/app/报警弹窗/系统管理员",
  bindingCard: "/app/报警弹窗/绑卡设置",
  angle: "/app/报警弹窗/角度监控",
  mes: "/dashboard/mes/view",
  io: "/dashboard/io/view",
} as const;

/** 右上角「主菜单 / 操作画面」导航按钮组（坐标与原始实现一致） */
export function NavPair({ ...rest }: { size?: number } & Passthrough = {}) {
  const navigate = useNavigate();
  return (
    <>
      {/* 本图元 render 出两个根节点，data-node-id 等透传属性只落在第一个上 */}
      <HmiButton
        x={1052}
        y={88}
        w={204}
        h={72}
        variant="nav"
        onClick={() => navigate(ROUTES.home)}
        {...rest}
      >
        主菜单
      </HmiButton>
      <HmiButton
        x={1052}
        y={212}
        w={204}
        h={72}
        variant="nav"
        onClick={() => navigate(ROUTES.operation)}
      >
        操作画面
      </HmiButton>
    </>
  );
}

/** 页面内右上角的「操作画面」单按钮（注料设置 / 温度设定 / 超级用户用） */
export function OperationButton({
  x = 1072,
  y = 140,
  w = 164,
  h = 84,
  ...rest
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /** 保留入参以兼容原页面；按钮字号已全站统一 */
  size?: number;
} & Passthrough) {
  const navigate = useNavigate();
  return (
    <HmiButton x={x} y={y} w={w} h={h} onClick={() => navigate(ROUTES.operation)} {...rest}>
      操作画面
    </HmiButton>
  );
}
