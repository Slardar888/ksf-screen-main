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
 * 预置计数（1280×800）
 *
 * 版面结构沿用原稿，并按全站统一标准整理：
 *  1. 标题：套用统一标题条 PageHeader（同样的底条/字号/居中/时钟）。
 *  2. 纵向节奏：行高 88、行距 92、步长 180、首行 y=128 —— 全部取 4 的倍数，
 *     避免被 4px 对齐网格吸附后间距畸变。
 *  3. 标签列统一 x=102 / 宽 246，四行标签同一个字号档。
 *  4. 控件列统一从 x=348 开始；数值/输入框在 348–676 内居中，
 *     因此四行的数值共用同一条竖轴。
 *  5. 同类按钮同尺寸：两个动作按钮 248×88，两个模式按钮 248×88。
 *  6. 输入控件高度由图元统一为 56，并在所在行内垂直居中。
 * ------------------------------------------------------------------ */

const ROW_H = 88;
const GAP = 92;
const ROW_STEP = ROW_H + GAP; // 180（4 的倍数）
const ROW_Y0 = 128;
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;

const LABEL_X = 102;
const LABEL_W = 246;
const CTL_X = LABEL_X + LABEL_W; // 348
const CTL_W = 328;
const BTN_W = 248;
const BTN2_X = 676;
const UNIT_X = 676;
const UNIT_W = 164;

export default function PresetCountPage() {
  const { state, set, toggle } = useMachine();

  return (
    <Stage width={1280} height={800}>
      <PageHeader title="预置计数" width={1280} />

      {/* R1 预置计数：开关 + 复位 */}
      <Text x={LABEL_X} y={rowY(0)} w={LABEL_W} h={ROW_H} size={40}>
        预置计数：
      </Text>
      <HmiButton
        x={CTL_X}
        y={rowY(0)}
        w={BTN_W}
        h={ROW_H}
        variant="red"
        onClick={() => toggle("presetCount")}
      >
        {state.toggles.presetCount ? "已开启" : "已关闭"}
      </HmiButton>
      <HmiButton
        x={BTN2_X}
        y={rowY(0)}
        w={BTN_W}
        h={ROW_H}
        variant="red"
        onClick={() => set("currentBags", 0)}
      >
        复 位
      </HmiButton>

      {/* R2 预置袋数 */}
      <Text x={LABEL_X} y={rowY(1)} w={LABEL_W} h={ROW_H} size={40}>
        预置袋数：
      </Text>
      <NumberField
        x={CTL_X}
        y={rowY(1)}
        w={CTL_W}
        h={ROW_H}
        value={state.presetBags}
        onChange={(v) => set("presetBags", v)}
      />
      <Text x={UNIT_X} y={rowY(1)} w={UNIT_W} h={ROW_H} size={30}>
        袋
      </Text>

      {/* R3 当前袋数 */}
      <Text x={LABEL_X} y={rowY(2)} w={LABEL_W} h={ROW_H} size={40}>
        当前袋数：
      </Text>
      <Readout
        x={CTL_X}
        y={rowY(2)}
        w={CTL_W}
        h={ROW_H}
        value={state.currentBags}
        digits={5}
        align="center"
      />
      <Text x={UNIT_X} y={rowY(2)} w={UNIT_W} h={ROW_H} size={30}>
        袋
      </Text>

      {/* R4 计数模式：两个模式按钮与上方按钮同尺寸同列 */}
      <Text x={LABEL_X} y={rowY(3)} w={LABEL_W} h={ROW_H} size={40}>
        计数模式：
      </Text>
      <HmiButton
        x={CTL_X}
        y={rowY(3)}
        w={BTN_W}
        h={ROW_H}
        variant={state.countMode === "cycle" ? "red" : "light"}
        color={state.countMode === "cycle" ? undefined : "#000"}
        onClick={() => set("countMode", "cycle")}
      >
        循环计数
      </HmiButton>
      <HmiButton
        x={BTN2_X}
        y={rowY(3)}
        w={BTN_W}
        h={ROW_H}
        variant={state.countMode === "alarmStop" ? "red" : "light"}
        color={state.countMode === "alarmStop" ? undefined : "#000"}
        onClick={() => set("countMode", "alarmStop")}
      >
        报警停机
      </HmiButton>

      <NavPair />
    </Stage>
  );
}
