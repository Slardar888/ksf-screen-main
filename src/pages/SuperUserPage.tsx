import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HmiButton,
  PageHeader,
  Panel,
  Readout,
  Stage,
  StatusButton,
  Text,
  type Passthrough,
} from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * 超级管理员调试（1280×800）
 *
 * 本轮只做「统一标题 + 列对齐 + 纵向节奏 + 尺寸统一」，文案与元素一个不增不减：
 *
 *  1. 标题：删掉原稿手搓的标题条（`<Panel x={6} y={5} w={1267} h={80} />`），
 *     改用全站统一的 `<PageHeader title="超级管理员调试" width={1280} />`
 *     —— 底条 y=0 高 56、标题 50 号居中、右上角时钟，全部由图元提供。
 *     原稿标题条里的两个导航按钮（操作画面 / 主菜单）是独立元素，保留，
 *     随内容整体下移到标题条之下（y=64）并按列基准右侧对齐。
 *     原稿标题条下方是三个栏目名（空包报警 / 手动区 / 色标报警）与各自内容，
 *     统一下移到 y=152 起（标题条 56 + 间距 16 + 导航行 72 + 间距 16 = 152）。
 *
 *  2. 纵向节奏（全部取 4 的倍数，否则会被 4px 对齐网格吸附成不等间距）：
 *     GAP=16、ROW_H=72、ROW_STEP=88、首行 ROW_Y0=224。
 *     栏目名 152–208，其下每行 88 步进：224、312、400、488、576…
 *     三个栏目共用同一套节奏常数与同一个 GAP=16。
 *
 *  3. 列对齐基准：整页按三列划分，左右边界与栏目名完全一致
 *     —— 0–308 空包报警 / 308–868 手动区 / 868–1280 色标报警。
 *     左列：标签列 x=8 宽 128、控件列 x=144 宽 152（原稿 146/154 不是 4 的倍数）。
 *     右列：标签列 x=868、1076（各宽 192），控件列同起点 x=868、1076。
 *     中列：四个点动按钮 224×72，两列 x=348 / 604，整块在列内居中。
 *
 *  4. 尺寸统一：全页按钮只有 3 种尺寸且高度都取 72 ——
 *     导航/原点按钮 192×72（操作画面、主菜单、横封/冷封原点确认、一键原点确认）、
 *     状态按钮左列 152×72（2 个，与左侧控件列同宽）、右列 192×72（2 个，
 *     与右列按钮同宽）、手动区点动按钮 224×72（4 个，完全同尺寸）。
 *     不再给 HmiButton 传 size（字号已全站统一为 28 档）。
 *
 *  5. 数值一律走 Readout：「横封位置」读数与原稿一样保持红色，
 *     但改成与所在行同 y 同高（700 / 64），不再像原稿那样比行盒上浮 10px。
 *
 * 原文件缺失的交互（点动按钮与两个原点确认按钮本来没有 onClick）沿用原实现：
 * 用本地 state 记录最近触发的操作给出可见反馈，不新增任何图元。
 * ------------------------------------------------------------------ */

/** 纵向节奏：四个常数都取 4 的倍数 */
const GAP = 16;
const NAV_Y = 64;
const NAV_H = 72;
const NAV_W = 192;
const SECTION_Y = 152;
const SECTION_H = 56;
const ROW_H = 72;
const ROW_STEP = ROW_H + GAP; // 88
const ROW_Y0 = SECTION_Y + SECTION_H + GAP; // 224
/** 第 n 行（从 0 开始）的 y */
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;

/** 三列基准（与三个栏目名的左右边界一致） */
const C1_X = 0;
const C1_W = 308;
const C2_X = 308;
const C2_W = 560;
const C3_X = 868;
const C3_W = 412;

/** 左列：标签列 / 控件列统一 */
const LABEL_X = 8;
const LABEL_W = 128;
const CTL_X = 144;
const CTL_W = 152;

/** 中列：四个点动按钮完全同尺寸，两列在列内居中 */
const MAN_W = 224;
const MAN_X1 = 348;
const MAN_X2 = 604;
/** 中列两条红色提示行 */
const WARN_X = 388;
const WARN_W = 400;
const WARN_H = 44;

/** 右列：标签列与控件列同起点 */
const C3_LBL_X1 = 868;
const C3_LBL_X2 = 1076;
/**
 * 右列（色标报警）所有元素共用同一个宽度 192：栏目名、两个状态按钮、
 * 两个原点确认按钮都是 868 / 1076 起、192 宽，因此右列的行间距恒为
 * GAP=16、右缘恒定 1268。原来状态按钮单独用 152 宽，右列出现
 * 4 / 56 / 16 三种行间距，看着像没对齐。
 */
const C3_ACT_W = 192;
/** 「一键原点确认」单独成行，在右列内居中（取 4 的倍数） */
const ONEKEY_X = 980;
/** 右列底部四行说明，行距 48 */
const NOTE_X = 908;
const NOTE_W = 328;
const NOTE_H = 44;
const NOTE_STEP = 48;

/** 中列底部「横封位置」行：面板、标签托板、读数三段等宽同起点 */
const FOOTER_Y = 700;
const FOOTER_H = 64;
const FOOTER_X = 420;
const FOOTER_W = 336;
const FOOTER_CELL_W = 168;

/**
 * 手动区点动按钮：同尺寸、同起点列，仅文案与高亮不同。
 * 抽成组件而不是"返回 JSX 的函数"，这样调用点上是一个 JSX 元素，
 * 插件注入的 data-node-id 才挂得上（再由 HmiButton 透传到 <button>）。
 */
function JogButton({
  x,
  y,
  label,
  active,
  onClick,
  "data-node-id": nodeId,
  ...rest
}: {
  x: number;
  y: number;
  label: string;
  active: boolean;
  onClick: () => void;
} & Passthrough) {
  return (
    <HmiButton
      x={x}
      y={y}
      w={MAN_W}
      h={ROW_H}
      variant={active ? "green" : "blueTop"}
      onClick={onClick}
      {...rest}
      data-node-id={nodeId}
    >
      {label}
    </HmiButton>
  );
}

export default function SuperUserPage() {
  const navigate = useNavigate();
  const { state, set, toggle } = useMachine();
  const t = state.toggles;

  /** 最近一次触发的操作（点动为瞬时动作，用它给出可见反馈） */
  const [lastCmd, setLastCmd] = useState<string | null>(null);

  return (
    <Stage width={1280} height={800}>
      <PageHeader title="超级管理员调试" width={1280} />

      {/* 原稿标题条内的两个导航按钮：保留，下移到标题条之下，与右列同起点 */}
      <HmiButton
        x={C3_LBL_X1}
        y={NAV_Y}
        w={NAV_W}
        h={NAV_H}
        variant="nav"
        onClick={() => navigate(ROUTES.operation)}
      >
        操作画面
      </HmiButton>
      <HmiButton
        x={C3_LBL_X2}
        y={NAV_Y}
        w={NAV_W}
        h={NAV_H}
        variant="nav"
        onClick={() => navigate(ROUTES.home)}
      >
        主菜单
      </HmiButton>

      {/* 三个栏目名：左右边界即三列的基准，行高与内容行对齐 */}
      <Text x={C1_X} y={SECTION_Y} w={C1_W} h={SECTION_H} size={40} align="center">
        空包报警
      </Text>
      <Text x={C2_X} y={SECTION_Y} w={C2_W} h={SECTION_H} size={40} align="center">
        手动区
      </Text>
      <Text x={C3_X} y={SECTION_Y} w={C3_W} h={SECTION_H} size={40} align="center">
        色标报警
      </Text>

      {/* 左列：空包报警 */}
      <Text x={LABEL_X} y={rowY(0)} w={LABEL_W} h={ROW_H} size={30} weight={400}>
        空包报警：
      </Text>
      <StatusButton
        x={CTL_X}
        y={rowY(0)}
        w={CTL_W}
        h={ROW_H}
        on={t.emptyAlarm}
        onLabel="已开启"
        variant="light"
        onVariant="light"
        onClick={() => toggle("emptyAlarm")}
      />
      <Text x={LABEL_X} y={rowY(1)} w={LABEL_W} h={ROW_H} size={30} weight={400}>
        报警方式：
      </Text>
      <StatusButton
        x={CTL_X}
        y={rowY(1)}
        w={CTL_W}
        h={ROW_H}
        on={t.emptyAlarmMode}
        onLabel="报 警"
        offLabel="停 机"
        variant="light"
        onVariant="light"
        onClick={() => toggle("emptyAlarmMode")}
      />

      {/* 中列：手动区四个点动按钮（完全同尺寸 224×72） */}
      <JogButton x={MAN_X1} y={rowY(0)} label="纵封单动" active={lastCmd === "纵封单动"} onClick={() => setLastCmd("纵封单动")} />
      <JogButton x={MAN_X2} y={rowY(0)} label="横封单动" active={lastCmd === "横封单动"} onClick={() => setLastCmd("横封单动")} />
      <JogButton x={MAN_X1} y={rowY(1)} label="冷封单动" active={lastCmd === "冷封单动"} onClick={() => setLastCmd("冷封单动")} />
      <JogButton x={MAN_X2} y={rowY(1)} label="联动手动" active={lastCmd === "联动手动"} onClick={() => setLastCmd("联动手动")} />

      <Text x={WARN_X} y={rowY(2)} w={WARN_W} h={WARN_H} size={25} weight={400} color="rgb(255, 98, 98)">
        注意：单动请先拍急停
      </Text>
      <Text x={WARN_X} y={rowY(3)} w={WARN_W} h={WARN_H} size={25} weight={400} color="rgb(255, 98, 98)">
        急停复位后再进行单动
      </Text>

      {/* 中列底部：横封位置（面板 / 标签托板 / 读数三段同起点、同高） */}
      <Panel x={FOOTER_X} y={FOOTER_Y} w={FOOTER_W} h={FOOTER_H} />
      <Text x={FOOTER_X} y={FOOTER_Y} w={FOOTER_CELL_W} h={FOOTER_H} size={40} plate>
        横封位置
      </Text>
      <Readout
        x={FOOTER_X + FOOTER_CELL_W}
        y={FOOTER_Y}
        w={FOOTER_CELL_W}
        h={FOOTER_H}
        value={state.crossSealPos}
        digits={3}
        align="center"
        color="rgb(255, 98, 98)"
      />

      {/* 右列：色标报警 */}
      <Text x={C3_LBL_X1} y={rowY(0)} w={C3_ACT_W} h={ROW_H} size={40}>
        异常报警
      </Text>
      <Text x={C3_LBL_X2} y={rowY(0)} w={C3_ACT_W} h={ROW_H} size={40}>
        报警模式
      </Text>
      <StatusButton
        x={C3_LBL_X1}
        y={rowY(1)}
        w={C3_ACT_W}
        h={ROW_H}
        on={t.markAlarm}
        variant="light"
        onVariant="light"
        onClick={() => toggle("markAlarm")}
      />
      <StatusButton
        x={C3_LBL_X2}
        y={rowY(1)}
        w={C3_ACT_W}
        h={ROW_H}
        on={t.markAlarmMode}
        onLabel="报 警"
        offLabel="停 机"
        variant="light"
        onVariant="light"
        onClick={() => toggle("markAlarmMode")}
      />

      <HmiButton
        x={C3_LBL_X1}
        y={rowY(2)}
        w={C3_ACT_W}
        h={ROW_H}
        variant={lastCmd === "横封原点确认" ? "green" : "blueTop"}
        onClick={() => {
          // 横封位置归零：本页底部「横封位置」读数即为此值的实时显示
          set("crossSealPos", 0);
          setLastCmd("横封原点确认");
        }}
      >
        横封原点确认
      </HmiButton>
      <HmiButton
        x={C3_LBL_X2}
        y={rowY(2)}
        w={C3_ACT_W}
        h={ROW_H}
        variant={lastCmd === "冷封原点确认" ? "green" : "blueTop"}
        onClick={() => {
          // 冷封位置归零（该值在「操作画面」的冷封位调整里使用）
          set("coldPos", 0);
          setLastCmd("冷封原点确认");
        }}
      >
        冷封原点确认
      </HmiButton>
      <HmiButton
        x={ONEKEY_X}
        y={rowY(3)}
        w={C3_ACT_W}
        h={ROW_H}
        variant="blueTop"
        onClick={() => set("crossSealPos", 0)}
      >
        一键原点确认
      </HmiButton>

      {[
        "横封，冷封零位调整方法：",
        "将横封或者冷封咬平时，",
        "按压三秒横封，冷封原点",
        "确认按钮",
      ].map((line, i) => (
        <Text
          key={line}
          x={NOTE_X}
          y={rowY(4) + i * NOTE_STEP}
          w={NOTE_W}
          h={NOTE_H}
          size={25}
          weight={400}
          color="rgb(255, 98, 98)"
        >
          {line}
        </Text>
      ))}
    </Stage>
  );
}
