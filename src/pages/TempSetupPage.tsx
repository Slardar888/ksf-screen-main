import { useNavigate } from "react-router-dom";
import {
  Abs,
  DarkPanel,
  HmiButton,
  NumberField,
  Readout,
  ScreenHeader,
  Stage,
  Text,
  type Passthrough,
} from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import { SealUnitGraphic } from "@/components/hmi/SealUnitGraphic";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * 温度设定（1280×800）
 *
 * 按《全站逐页精修标准 v2》做版面标准化：文案、元素集合、交互行为都不变。
 *
 *  1. 标题：本页是两行式顶栏，按契约**保留 ScreenHeader**（内部已套用统一
 *     标题规范），不换 PageHeader；顶栏占 0–117，内容都在其下方。
 *  2. 四个温区是同一类结构，现在**完全对齐**：同一个起始 x（左列 60 /
 *     右列 832）、同一个宽 268 高 156、同一个标签行高 40、同一个数值列宽
 *     216 + 单位列 52；左右两列的**行 y 完全一致**（252 / 476），
 *     同一列的**行距完全相等**（步长 224 = 行高 156 + 行距 68，都是 4 的倍数）。
 *  3. 温区内部三行：标题 0–40、PV 40–92、SV 92–156；PV 与 SV 的标签
 *     与各自的数值行同 y 同高，四个通道因此逐行对齐。
 *  4. AlBox：面板 192×72，输入框 136×72、AL 标签 56×72 —— 输入框与标签
 *     同 y 同高、并排合成整宽 192，四个 AlBox 完全同尺寸（上排 y=188、
 *     下排 y=512，左 340 / 右 628），不再有 189/190、511/512 的错位。
 *  5. 中央机构示意图所在 Abs：x/y/w/h 吸附到 4 的倍数（328/168/508/424），
 *     viewBox 507×422 的比例基本不变。
 *  6. 数字：PV 值改用 Readout（原来用裸 Text 画数字）。
 * ------------------------------------------------------------------ */

/** 温区面板：四个通道共用同一套尺寸，只由 x / y 决定落位 */
const CH_W = 268;
const CH_H = 156;
const CH_X_L = 60; // 左列起始 x
const CH_X_R = 832; // 右列起始 x
/** 纵向节奏：行高 156、行距 68、步长 224、首行 y=252（全部 4 的倍数） */
const CH_GAP = 68;
const CH_STEP = CH_H + CH_GAP; // 224
const CH_Y0 = 252;
/** 第 n 行（从 0 开始）温区面板的 y：252 / 476 */
const chRowY = (i: number) => CH_Y0 + i * CH_STEP;

/** 温区内部三行 + 数值/单位列 */
const CH_LBL_H = 40; // 标题行
const CH_PV_Y = 40; // PV 值行
const CH_PV_H = 52;
const CH_SV_Y = 92; // SV 值行
const CH_SV_H = CH_H - CH_SV_Y; // 64
const CH_UNIT_W = 52; // PV / SV 标签列宽
const CH_VAL_W = CH_W - CH_UNIT_W; // 216

/** AlBox（悬浮的 AL 报警值框） */
const AL_W = 192;
const AL_H = 72;
const AL_VAL_W = 136;
const AL_TAG_W = AL_W - AL_VAL_W; // 56
const AL_X_L = 340;
const AL_X_R = 628;
const AL_Y0 = 188; // 上排
const AL_Y1 = 512; // 下排

/** 中央机械示意：原 x/y/w/h = 327/170/507/422，吸附到 4 的倍数 */
const FIG_X = 328;
const FIG_Y = 168;
const FIG_W = 508;
const FIG_H = 424;

/** 右下角「操作画面」 */
const GO_X = 1108;
const GO_Y = 664;
const GO_W = 148;
const GO_H = 104;

/** 一个温度通道面板：标题 / PV(红读数) / SV(黄可输入)，三行同高同起点 */
function TempChannel({
  x,
  y,
  label,
  pv,
  pvTag,
  sv,
  svTag,
  onSv,
  "data-node-id": nodeId,
  ...rest
}: {
  x: number;
  y: number;
  label: string;
  pv: number;
  pvTag: string;
  sv: number;
  svTag: string;
  onSv: (v: number) => void;
} & Passthrough) {
  return (
    <>
      <DarkPanel x={x} y={y} w={CH_W} h={CH_H} {...rest} data-node-id={nodeId} />
      <Text x={x} y={y} w={CH_W} h={CH_LBL_H} size={26} plate>
        {label}
      </Text>
      <Readout
        x={x}
        y={y + CH_PV_Y}
        w={CH_VAL_W}
        h={CH_PV_H}
        value={pv}
        digits={3}
        color="rgb(208, 2, 27)"
      />
      <Text
        x={x + CH_VAL_W}
        y={y + CH_PV_Y}
        w={CH_UNIT_W}
        h={CH_PV_H}
        size={26}
        weight={400}
        color="rgb(109, 193, 254)"
      >
        {pvTag}
      </Text>
      <NumberField
        x={x}
        y={y + CH_SV_Y}
        w={CH_VAL_W}
        h={CH_SV_H}
        value={sv}
        onChange={onSv}
      />
      <Text
        x={x + CH_VAL_W}
        y={y + CH_SV_Y}
        w={CH_UNIT_W}
        h={CH_SV_H}
        size={26}
        weight={400}
        color="rgb(109, 193, 254)"
      >
        {svTag}
      </Text>
    </>
  );
}

/** 悬浮的 AL 值框：输入框与 AL 标签同 y 同高、并排合成整宽 */
function AlBox({
  x,
  y,
  value,
  onChange,
  "data-node-id": nodeId,
  ...rest
}: {
  x: number;
  y: number;
  value: number;
  onChange: (v: number) => void;
} & Passthrough) {
  return (
    <>
      <DarkPanel x={x} y={y} w={AL_W} h={AL_H} {...rest} data-node-id={nodeId} />
      <NumberField x={x} y={y} w={AL_VAL_W} h={AL_H} value={value} onChange={onChange} />
      <Text
        x={x + AL_VAL_W}
        y={y}
        w={AL_TAG_W}
        h={AL_H}
        size={26}
        weight={400}
        color="rgb(109, 193, 254)"
      >
        AL
      </Text>
    </>
  );
}

export default function TempSetupPage() {
  const navigate = useNavigate();
  const { state, setTemp, set } = useMachine();
  const t = state.temps;

  return (
    <Stage width={1280} height={800}>
      <ScreenHeader title="温度设定" titleSize={28} width={1280} />

      {/* 中央机械示意（坐标吸附到 4 的倍数） */}
      <Abs x={FIG_X} y={FIG_Y} w={FIG_W} h={FIG_H}>
        <SealUnitGraphic />
      </Abs>

      {/* 四路温度：左右两列同起始 x、同宽高，行 y 完全一致 */}
      <TempChannel
        x={CH_X_L}
        y={chRowY(0)}
        label="纵封内侧/℃"
        pv={t.vInner.pv}
        pvTag="PV"
        sv={t.vInner.sv}
        svTag="SV"
        onSv={(v) => setTemp("vInner", "sv", v)}
      />
      <TempChannel
        x={CH_X_L}
        y={chRowY(1)}
        label="横封内侧/℃"
        pv={t.hInner.pv}
        pvTag="PV"
        sv={t.hInner.sv}
        svTag="SV"
        onSv={(v) => setTemp("hInner", "sv", v)}
      />
      <TempChannel
        x={CH_X_R}
        y={chRowY(0)}
        label="纵封外侧/℃"
        pv={t.vOuter.pv}
        pvTag="PV"
        sv={t.vOuter.sv}
        svTag="SV"
        onSv={(v) => setTemp("vOuter", "sv", v)}
      />
      <TempChannel
        x={CH_X_R}
        y={chRowY(1)}
        label="横封外侧/℃"
        pv={t.hOuter.pv}
        pvTag="PV"
        sv={t.hOuter.sv}
        svTag="SV"
        onSv={(v) => setTemp("hOuter", "sv", v)}
      />

      {/* AL 报警值：四个盒子同一尺寸、同一 y 分组 */}
      <AlBox
        x={AL_X_L}
        y={AL_Y0}
        value={state.als[0]}
        onChange={(v) => set("als", [v, state.als[1], state.als[2], state.als[3]])}
      />
      <AlBox
        x={AL_X_R}
        y={AL_Y0}
        value={state.als[1]}
        onChange={(v) => set("als", [state.als[0], v, state.als[2], state.als[3]])}
      />
      <AlBox
        x={AL_X_L}
        y={AL_Y1}
        value={state.als[2]}
        onChange={(v) => set("als", [state.als[0], state.als[1], v, state.als[3]])}
      />
      <AlBox
        x={AL_X_R}
        y={AL_Y1}
        value={state.als[3]}
        onChange={(v) => set("als", [state.als[0], state.als[1], state.als[2], v])}
      />

      <HmiButton
        x={GO_X}
        y={GO_Y}
        w={GO_W}
        h={GO_H}
        onClick={() => navigate(ROUTES.operation)}
      >
        操作画面
      </HmiButton>
    </Stage>
  );
}
