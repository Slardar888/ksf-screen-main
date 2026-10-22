import {
  HmiButton,
  NumberField,
  PageHeader,
  Readout,
  Stage,
  Text,
} from "@/components/hmi/primitives";
import { NavPair } from "@/components/hmi/shared";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * 料泵清洗（1280×800）
 *
 * 版面按全站统一标准整理（只调坐标 / 尺寸，不改文案、不增删元素）：
 *
 *  1. 标题：原 `<PlainTitle title="料泵清洗" w={640} align="left" />`
 *     → 统一标题条 `<PageHeader title="料泵清洗" width={1280} />`
 *     （底条 0..56、字号 50、**居中**，右上角同一位置的时钟）。
 *
 *  2. 右上角两行红色「注意」提示：文案、红色、两行都原样保留，
 *     只把 y 从 8 / 40 下移到 64 / 96（都是 4 的倍数、都在标题条 y=0..56 之下，
 *     第二行盒底 128 与首行 128 齐平，不与任何元素重叠）；
 *     x 从 650 收到 652、宽从 502 收到 400（652..1052），
 *     右缘正好落在导航按钮组左缘 1052 上，不再被「主菜单 / 操作画面」压住。
 *
 *  3. 纵向节奏：行高 88、行距 44、步长 132、首行 y=128 —— 四个常数全是 4 的倍数，
 *     五行 y = 128 / 260 / 392 / 524 / 656，末行底边 744；
 *     全页行距只有 44 一种（原稿 133/296/404/560/668 毫无节奏可言）。
 *
 *  4. 列对齐：左栏统一 x=104；标签列宽 244 → 控件列统一从 x=348 起；
 *     右栏基准 x=512 = 348 + 按钮宽 164 = 104 + 字段宽 248 + 单位宽 160，
 *     两个 NumberField 的宽度与单位宽度全页一致；两个列标题同宽 408（104..512 / 512..920）。
 *
 *  5. 尺寸统一：料泵三个按钮（酱已开启、液已开启、纵封单动）统一 164×88、间距 40；
 *     三个 NumberField 统一 248×88（原来 246×81 / 328×81 两种），
 *     盒子与所在行同高、控件在行内垂直居中；剩余清洗时间的数值改用 `Readout`。
 * ------------------------------------------------------------------ */

const ROW_H = 88;
const GAP = 44;
const ROW_STEP = ROW_H + GAP; // 132（4 的倍数）
const ROW_Y0 = 128;
/** 第 n 行（从 0 开始）的 y：128 / 260 / 392 / 524 / 656 */
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;

/** 左栏基准 + 标签列 / 控件列 */
const LABEL_X = 104;
const LABEL_W = 244;
const CTL_X = LABEL_X + LABEL_W; // 348

/** 料泵三个按钮：同尺寸同间距 */
const BTN_W = 164;
const BTN_GAP = 40;

/** 右栏基准 = 348 + 164（按钮宽）= 104 + 248（字段宽）+ 160（单位宽） */
const COL_R_X = 512;
/** 两栏的列表头宽度 */
const COL_W = 408;
/** 数值 / 输入字段：全页同宽 */
const FIELD_W = 248;
/** 单位格：全页同宽 */
const UNIT_W = 160;
const UNIT_R_X = LABEL_X + FIELD_W; // 352
const UNIT_R2_X = COL_R_X + FIELD_W; // 760

/** 右上角两行「注意」提示 */
const NOTICE_X = 652;
const NOTICE_W = 400; // 652..1052，右缘贴住 NavPair 左缘
const NOTICE_Y0 = 64; // ≥ 64：在标题条（0..56）之下
const NOTICE_H = 32;
const NOTICE_STEP = 32; // 第二行 y=96，盒底 128 与首行齐平

export default function PumpCleanPage() {
  const { state, set, toggle } = useMachine();
  const t = state.toggles;

  return (
    <Stage width={1280} height={800}>
      <PageHeader title="料泵清洗" width={1280} />

      {/* 右上角两行红色「注意」提示（文案与颜色原样保留） */}
      <Text
        x={NOTICE_X}
        y={NOTICE_Y0}
        w={NOTICE_W}
        h={NOTICE_H}
        size={24}
        weight={400}
        color="rgb(255, 98, 98)"
      >
        注意：单动请先拍急停，
      </Text>
      <Text
        x={NOTICE_X}
        y={NOTICE_Y0 + NOTICE_STEP}
        w={NOTICE_W}
        h={NOTICE_H}
        size={24}
        weight={400}
        color="rgb(255, 98, 98)"
      >
        急停复位后再进行单动。
      </Text>

      {/* R1 料泵清洗功能：酱泵 / 液泵 / 纵封单动，三个按钮完全同尺寸 */}
      <Text x={LABEL_X} y={rowY(0)} w={LABEL_W} h={ROW_H} size={40}>
        料泵清洗功能：
      </Text>
      <HmiButton
        x={CTL_X}
        y={rowY(0)}
        w={BTN_W}
        h={ROW_H}
        variant="red"
        onClick={() => toggle("pumpSauce")}
      >
        {t.pumpSauce ? "酱已开启" : "酱已关闭"}
      </HmiButton>
      <HmiButton
        x={CTL_X + BTN_W + BTN_GAP}
        y={rowY(0)}
        w={BTN_W}
        h={ROW_H}
        variant="red"
        onClick={() => toggle("pumpLiquid")}
      >
        {t.pumpLiquid ? "液已开启" : "液已关闭"}
      </HmiButton>
      <HmiButton
        x={CTL_X + 2 * (BTN_W + BTN_GAP)}
        y={rowY(0)}
        w={BTN_W}
        h={ROW_H}
        variant="blueSingle"
        onClick={() => toggle("jointDetect")}
      >
        纵封单动
      </HmiButton>

      {/* R2 两栏的列标题（同宽 408） */}
      <Text x={LABEL_X} y={rowY(1)} w={COL_W} h={ROW_H} size={40}>
        清洗速度设置
      </Text>
      <Text x={COL_R_X} y={rowY(1)} w={COL_W} h={ROW_H} size={40}>
        清洗时间设置
      </Text>

      {/* R3 清洗速度 / 清洗时间：输入框与单位在左右两栏的位置完全对齐 */}
      <NumberField
        x={LABEL_X}
        y={rowY(2)}
        w={FIELD_W}
        h={ROW_H}
        value={state.cleanSpeed}
        onChange={(v) => set("cleanSpeed", v)}
      />
      <Text x={UNIT_R_X} y={rowY(2)} w={UNIT_W} h={ROW_H} size={30}>
        次/分钟
      </Text>
      <NumberField
        x={COL_R_X}
        y={rowY(2)}
        w={FIELD_W}
        h={ROW_H}
        value={state.cleanTime}
        onChange={(v) => set("cleanTime", v)}
      />
      <Text x={UNIT_R2_X} y={rowY(2)} w={UNIT_W} h={ROW_H} size={30}>
        分钟
      </Text>

      {/* R4 两栏的列标题 */}
      <Text x={LABEL_X} y={rowY(3)} w={COL_W} h={ROW_H} size={40}>
        剩余清洗时间
      </Text>
      <Text x={COL_R_X} y={rowY(3)} w={COL_W} h={ROW_H} size={40}>
        纵封运转速度
      </Text>

      {/* R5 剩余清洗时间（数值改用 Readout）/ 纵封运转速度 */}
      <Readout
        x={LABEL_X}
        y={rowY(4)}
        w={FIELD_W}
        h={ROW_H}
        value={state.cleanRemain}
        digits={3}
        align="center"
      />
      <Text x={UNIT_R_X} y={rowY(4)} w={UNIT_W} h={ROW_H} size={30}>
        秒
      </Text>
      <NumberField
        x={COL_R_X}
        y={rowY(4)}
        w={FIELD_W}
        h={ROW_H}
        value={state.sealRunSpeed}
        onChange={(v) => set("sealRunSpeed", v)}
      />

      <NavPair />
    </Stage>
  );
}
