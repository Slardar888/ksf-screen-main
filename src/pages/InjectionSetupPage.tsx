import { useNavigate } from "react-router-dom";
import {
  Abs,
  DarkPanel,
  HmiButton,
  NumberField,
  Panel,
  Readout,
  ScreenHeader,
  Stage,
  StatusButton,
  Stepper,
  Text,
  type Passthrough,
} from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * 注料设置（参数设置，1280×800）
 *
 * 按《全站逐页精修标准 v2》做版面标准化：文案、元素集合、交互行为都不变，
 * 只统一标题、对齐、节奏与尺寸。
 *
 *  1. 标题：本页是两行式顶栏，按契约**保留 ScreenHeader**（它内部已套用统一
 *     标题规范：同样的底条 / 字号 / 居中 / 时钟），不换 PageHeader；顶栏
 *     占 0–117，内容首行从 128 起，不与标题重叠。
 *  2. 纵向节奏：行高 148、行距 20、步长 168、首行 y=128 —— 四个常数**全是
 *     4 的倍数**，否则会被 4px 对齐网格吸附出 18/22 交替的间距。
 *  3. 列对齐：四个参数块共用同一宽度 412；左列 x=52，列间距 100，右列 x=564；
 *     块内标题行高 52、控件行高 96，控件与单位列都从 y+52 起、同高 96。
 *     原本 Stepper 通铺 410、单位「度/秒」压在 + 号上，现在控件宽 328 +
 *     单位列 84 并排，控件与所在行同起点同高、互不压盖，四块完全一致。
 *  4. 尺寸统一：底部 2×2 按钮组 4 个按钮完全同尺寸 188×100，横纵间距同为 16；
 *     右侧两个导航按钮同为 164×84；面板/滑块/指示条一律取 4 的倍数。
 *  5. 数字：当前位置改用 Readout（原来用裸 Text 画数字）。
 *  6. 行为未动：「微调+/粗调+」都是 +1、「微调−/粗调−」都是 −1，沿用当前实现。
 * ------------------------------------------------------------------ */

const BAR_LABELS = ["1,600", "1,500", "1,200", "900", "600", "300", "0"];

/** 纵向节奏：四个常数都是 4 的倍数（行高 / 行距 / 步长 / 首行 y） */
const ROW_H = 148;
const GAP = 20;
const ROW_STEP = ROW_H + GAP; // 168
const ROW_Y0 = 128;
/** 第 n 行（从 0 开始）参数块的 y */
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;

/** 参数块：两列共用同一宽度与列间距 */
const BLOCK_W = 412;
const BLOCK_X0 = 52;
const COL_GAP = 100;
const BLOCK_X1 = BLOCK_X0 + BLOCK_W + COL_GAP; // 564
const BLOCK_LBL_H = 52; // 块内标题行高
const BLOCK_CTL_H = ROW_H - BLOCK_LBL_H; // 96（控件行高）
const UNIT_W = 84; // 单位列宽
const CTL_W = BLOCK_W - UNIT_W; // 328

/** 克重刻度条：与上一行共用 GAP=20 */
const BAR_Y = rowY(2); // 464
const BAR_H = 96;
const BAR_W = 1024;
const BAR_STEP = 124; // 刻度间距
const GRID_X0 = 8;
const LABEL_X0 = 12;
const LABEL_W = 100;
const LABEL_H = 28;
const GRID_Y = BAR_Y + 32;
const GRID_H = 52;
const IND_Y = BAR_Y + 56;
const IND_H = 28;
const IND_W = 756; // 当前克重指示条（原为 1024×0.74=757.76，取 4 的倍数）
const MARK_Y = BAR_Y + 32;
const MARK_H = 60;

/** 底部「克重调整」2×2 按钮组：横纵间距同为 16，成整齐的 2×2 */
const BTN_W = 188;
const BTN_H = 100;
const BTN_GAP = 16;
const BTN_X0 = 212;
const BTN_X1 = BTN_X0 + BTN_W + BTN_GAP; // 416
const BTN_Y0 = BAR_Y + BAR_H + BTN_GAP; // 576
const BTN_Y1 = BTN_Y0 + BTN_H + BTN_GAP; // 692
/** 按钮组的垂直中线（684）：左侧「克重 / 调整」两行合成整体居中于它 */
const GROUP_MID = (BTN_Y0 + BTN_Y1 + BTN_H) / 2;
const TITLE_X = 0;
const TITLE_W = 204;
const TITLE_H = 60;
const TITLE_Y0 = GROUP_MID - TITLE_H; // 624
const TITLE_Y1 = GROUP_MID; // 684

/** 红色提示行 + 「粗调圈数」面板（面板底边正好落在画布底 800） */
const HINT_X = 656;
const HINT_Y = 592;
const HINT_W = 412;
const HINT_H = 36;
const TURN_X = 712;
const TURN_Y = 628;
const TURN_W = 260;
const TURN_H = 172;
const TURN_LBL_H = 68;
const TURN_CTL_Y = TURN_Y + TURN_LBL_H; // 696
const TURN_CTL_H = TURN_H - TURN_LBL_H; // 104
const TURN_VAL_W = 200;
const TURN_UNIT_W = TURN_W - TURN_VAL_W; // 60

/**
 * 右侧功能列：导航 / 回吸开关 / 计量回零 / 当前位置 共 5 个分组，
 * **全部分组共用同一个 20px 间距**（原稿是 52/28/24/20 四种，看上去疏密不一）。
 * 同类控件同 x 同宽：按钮 164、文字与面板 256。
 */
const FN_X = 1024;
const FN_W = 256;
const FN_GAP = 20;
const NAV_X = 1072;
const NAV_W = 164;
const NAV_H = 84;
const NAV_Y0 = 140;
const NAV_Y1 = NAV_Y0 + NAV_H + FN_GAP; // 244
const FN_LBL_Y = NAV_Y1 + NAV_H + FN_GAP; // 348
const FN_LBL_H = 56;
const FN_BTN_Y = FN_LBL_Y + FN_LBL_H + FN_GAP; // 424
const FN_BTN_H = 72;
const NOTE_Y = FN_BTN_Y + FN_BTN_H + FN_GAP; // 516
const NOTE_H = 28;
const ZERO_Y = NOTE_Y + NOTE_H + FN_GAP; // 564
const ZERO_H = 72;
const POS_X = 1036;
const POS_Y = ZERO_Y + ZERO_H + FN_GAP; // 656
const POS_W = 232;
const POS_H = 132;
const POS_LBL_H = 44;

/** 一个参数块：标题托板 + 步进器 + 单位列（三者同宽同高基准） */
function Block({
  x,
  y,
  label,
  value,
  unit,
  digits,
  step,
  onChange,
  "data-node-id": nodeId,
  ...rest
}: {
  x: number;
  y: number;
  label: string;
  value: number;
  unit: string;
  digits: number;
  step: number;
  onChange: (v: number) => void;
} & Passthrough) {
  return (
    <>
      <DarkPanel x={x} y={y} w={BLOCK_W} h={ROW_H} {...rest} data-node-id={nodeId} />
      <Text x={x} y={y} w={BLOCK_W} h={BLOCK_LBL_H} size={28} plate>
        {label}
      </Text>
      <Stepper
        x={x}
        y={y + BLOCK_LBL_H}
        w={CTL_W}
        h={BLOCK_CTL_H}
        value={value}
        digits={digits}
        step={step}
        color="#fff"
        onChange={onChange}
      />
      <Text
        x={x + CTL_W}
        y={y + BLOCK_LBL_H}
        w={UNIT_W}
        h={BLOCK_CTL_H}
        size={35}
        color="rgb(109, 193, 254)"
      >
        {unit}
      </Text>
    </>
  );
}

export default function InjectionSetupPage() {
  const navigate = useNavigate();
  const { state, set, toggle } = useMachine();

  return (
    <Stage width={1280} height={800}>
      <ScreenHeader title="参数设置" titleSize={40} width={1280} />

      <Block
        x={BLOCK_X0}
        y={rowY(0)}
        label="酱注料启动时机"
        value={state.sauceStartAngle}
        unit="度"
        digits={0}
        step={1}
        onChange={(v) => set("sauceStartAngle", v)}
      />
      <Block
        x={BLOCK_X1}
        y={rowY(0)}
        label="酱注料保持时间"
        value={state.sauceHoldTime}
        unit="秒"
        digits={2}
        step={0.01}
        onChange={(v) => set("sauceHoldTime", v)}
      />
      <Block
        x={BLOCK_X0}
        y={rowY(1)}
        label="回吸阀启动时机"
        value={state.suckStartAngle}
        unit="度"
        digits={0}
        step={1}
        onChange={(v) => set("suckStartAngle", v)}
      />
      <Block
        x={BLOCK_X1}
        y={rowY(1)}
        label="回吸阀保持角度"
        value={state.suckHoldAngle}
        unit="度"
        digits={0}
        step={1}
        onChange={(v) => set("suckHoldAngle", v)}
      />

      {/* 克重调整条形图：刻度标签 / 刻度线 / 当前值指示条 / 游标 */}
      <Panel x={0} y={BAR_Y} w={BAR_W} h={BAR_H} />
      {BAR_LABELS.map((label, i) => (
        <Text
          key={label}
          x={LABEL_X0 + i * BAR_STEP}
          y={BAR_Y}
          w={LABEL_W}
          h={LABEL_H}
          size={19}
          weight={400}
          align="center"
        >
          {label}
        </Text>
      ))}
      {BAR_LABELS.map((label, i) => (
        <Abs
          key={`grid-${label}`}
          x={GRID_X0 + i * BAR_STEP}
          y={GRID_Y}
          w={4}
          h={GRID_H}
          style={{ background: "rgba(140, 180, 255, 0.45)" }}
        />
      ))}
      {/* 当前克重指示条 */}
      <Abs
        x={GRID_X0}
        y={IND_Y}
        w={IND_W}
        h={IND_H}
        style={{
          background: "linear-gradient(90deg, rgba(80,200,120,.15), rgba(105,254,98,.85))",
        }}
      />
      <Abs
        x={GRID_X0 + IND_W}
        y={MARK_Y}
        w={4}
        h={MARK_H}
        style={{ background: "#fff" }}
      />

      <Text x={TITLE_X} y={TITLE_Y0} w={TITLE_W} h={TITLE_H} size={38}>
        <span style={{ color: "#fff" }}>克重</span>
      </Text>
      <Text x={TITLE_X} y={TITLE_Y1} w={TITLE_W} h={TITLE_H} size={38}>
        <span style={{ color: "#fff" }}>调整</span>
      </Text>

      {/* 微调 / 粗调：2×2 四按钮完全同尺寸，横纵间距一致 16 */}
      <HmiButton
        x={BTN_X0}
        y={BTN_Y0}
        w={BTN_W}
        h={BTN_H}
        onClick={() => set("coarseTurns", state.coarseTurns + 1)}
      >
        微调+
      </HmiButton>
      <HmiButton
        x={BTN_X1}
        y={BTN_Y0}
        w={BTN_W}
        h={BTN_H}
        variant="blueTop"
        onClick={() => set("coarseTurns", state.coarseTurns + 1)}
      >
        粗调+
      </HmiButton>
      <HmiButton
        x={BTN_X0}
        y={BTN_Y1}
        w={BTN_W}
        h={BTN_H}
        onClick={() => set("coarseTurns", Math.max(0, state.coarseTurns - 1))}
      >
        微调-
      </HmiButton>
      <HmiButton
        x={BTN_X1}
        y={BTN_Y1}
        w={BTN_W}
        h={BTN_H}
        variant="blueTop"
        onClick={() => set("coarseTurns", Math.max(0, state.coarseTurns - 1))}
      >
        粗调-
      </HmiButton>

      <Text x={HINT_X} y={HINT_Y} w={HINT_W} h={HINT_H} size={29} color="rgba(255, 86, 86, 0.8)">
        显示不准确时，请回零一次。
      </Text>

      <DarkPanel x={TURN_X} y={TURN_Y} w={TURN_W} h={TURN_H} />
      <Text x={TURN_X} y={TURN_Y} w={TURN_W} h={TURN_LBL_H} size={28} plate>
        粗调圈数
      </Text>
      <NumberField
        x={TURN_X}
        y={TURN_CTL_Y}
        w={TURN_VAL_W}
        h={TURN_CTL_H}
        value={state.coarseTurns}
        onChange={(v) => set("coarseTurns", v)}
      />
      <Text
        x={TURN_X + TURN_VAL_W}
        y={TURN_CTL_Y}
        w={TURN_UNIT_W}
        h={TURN_CTL_H}
        size={30}
        color="rgb(109, 193, 254)"
      >
        圈
      </Text>

      <HmiButton
        x={NAV_X}
        y={NAV_Y0}
        w={NAV_W}
        h={NAV_H}
        onClick={() => navigate(ROUTES.operation)}
      >
        操作画面
      </HmiButton>
      <HmiButton
        x={NAV_X}
        y={NAV_Y1}
        w={NAV_W}
        h={NAV_H}
        onClick={() => navigate(ROUTES.home)}
      >
        主菜单
      </HmiButton>

      <Text x={FN_X} y={FN_LBL_Y} w={FN_W} h={FN_LBL_H} size={28}>
        回吸功能：
      </Text>
      <StatusButton
        x={NAV_X}
        y={FN_BTN_Y}
        w={NAV_W}
        h={FN_BTN_H}
        on={state.toggles.suckBack}
        onClick={() => toggle("suckBack")}
      />

      <Text x={FN_X} y={NOTE_Y} w={FN_W} h={NOTE_H} size={19} color="rgb(255, 86, 86)">
        蝶阀打开再 进行计量回零
      </Text>
      <HmiButton
        x={NAV_X}
        y={ZERO_Y}
        w={NAV_W}
        h={ZERO_H}
        variant="blueRev"
        onClick={() => set("currentPos", 0)}
      >
        计量回零
      </HmiButton>

      <DarkPanel x={POS_X} y={POS_Y} w={POS_W} h={POS_H} />
      <Text x={POS_X} y={POS_Y} w={POS_W} h={POS_LBL_H} size={28} plate>
        当前位置
      </Text>
      <Readout
        x={POS_X}
        y={POS_Y + POS_LBL_H}
        w={POS_W}
        h={POS_H - POS_LBL_H}
        value={state.currentPos}
        digits={3}
        color="rgb(208, 66, 83)"
        align="center"
      />
    </Stage>
  );
}
