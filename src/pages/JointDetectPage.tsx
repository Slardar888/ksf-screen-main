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
 * 接头检测（1280×800）
 *
 * 版面按全站统一标准整理（只调坐标 / 尺寸，不改文案、不增删元素）：
 *
 *  1. 标题：原 `<PlainTitle title="接头检测" />`（只有文字、没有底条）
 *     → 统一标题条 `<PageHeader title="接头检测" width={1280} />`
 *     （底条 0..56、字号 50、居中、右上角同一位置的时钟）。
 *
 *  2. 纵向节奏：行高 88、行距 44、步长 132、首行 y=120 —— 四个常数全是 4 的倍数，
 *     五行 y = 120 / 252 / 384 / 516 / 648，末行底边 736：
 *     距标题条底边 64、距画布底边 64；全页行距只有 44 一种
 *     （原稿行起点 127/307/487/638/696，相邻行距 92/92/65/58，长短不一）。
 *
 *  3. 列对齐：标签列统一 x=104 / 宽 244，控件列统一从 x=348 起（标签列右缘）；
 *     右栏基准 x=512，与「料泵清洗」页同一个列基准。
 *
 *  4. 数值同轴：三个数值一律用 `Readout`（不再用裸 Text 画数字）、格子等宽 112：
 *     「计算」的数值与末行「自动停料袋数」的数值共用同一条竖轴（x=808..920，中心 864），
 *     「自动停料前袋数」的数值自成第二条轴（x=400..512，中心 456）——同页数值轴共 2 条。
 *
 *  5. 尺寸统一：三个按钮（已开启/已关闭、延时停机、自动停料）统一 248×88；
 *     三个 NumberField 统一 248×88，盒子与所在行同高、控件在行内垂直居中
 *     （原稿控件盒高 65、起点 378，比所在行偏下且不与行同起点）。
 *
 * 另外保留原实现的两处行为修复（与版面无关，不改 store.tsx）：
 *  - 「延时停机 / 自动停料」各写入明确值：jointMode = true / false
 *    （原稿两者都调 toggle("jointMode")，点任一都会翻转）；
 *  - jointMode 位于 state.toggles 内，因此通过 set("toggles", …) 整体写回。
 * ------------------------------------------------------------------ */

const ROW_H = 88;
const GAP = 44;
const ROW_STEP = ROW_H + GAP; // 132（4 的倍数）
const ROW_Y0 = 120;
/** 第 n 行（从 0 开始）的 y：120 / 252 / 384 / 516 / 648 */
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;

/** 标签列 / 控件列（全页唯一基准） */
const LABEL_X = 104;
const LABEL_W = 244;
const CTL_X = LABEL_X + LABEL_W; // 348
const CTL_W = 248;

/** 按钮：同页三个按钮完全同尺寸 */
const BTN_W = 248;
const BTN_GAP = 52;

/** 右栏基准（与「料泵清洗」同一列） */
const COL_B_X = 512;

/** 数值格：三个数值等宽，才有共同的对称轴；112 宽可容纳 3 位小数的读数 */
const VALUE_W = 112;

/** 第 2 行：接头长度设置 | 袋 | 计算： | 数值 | 秒 */
const UNIT_X = CTL_X + CTL_W; // 596
const UNIT_W = 80;
const CALC_X = UNIT_X + UNIT_W; // 676
const CALC_W = 132;
const VALUE_X = CALC_X + CALC_W; // 808
const SEC_X = VALUE_X + VALUE_W; // 920
const SEC_W = 48;

/** 末行两列：每列都是「输入框 | 袋 | 数值」，列内偏移完全一致 */
const B_UNIT_W = 48;
const B1_UNIT_X = LABEL_X + CTL_W; // 352
const B1_VALUE_X = B1_UNIT_X + B_UNIT_W; // 400
const B2_UNIT_X = COL_B_X + CTL_W; // 760
const B2_VALUE_X = B2_UNIT_X + B_UNIT_W; // 808 —— 与第 2 行的数值格同轴

export default function JointDetectPage() {
  const { state, set, toggle } = useMachine();
  const t = state.toggles;

  return (
    <Stage width={1280} height={800}>
      <PageHeader title="接头检测" width={1280} />

      {/* R1 接头检测功能 */}
      <Text x={LABEL_X} y={rowY(0)} w={LABEL_W} h={ROW_H} size={40}>
        接头检测功能：
      </Text>
      <HmiButton
        x={CTL_X}
        y={rowY(0)}
        w={BTN_W}
        h={ROW_H}
        variant="red"
        color={t.jointDetect ? "#000" : undefined}
        onClick={() => toggle("jointDetect")}
      >
        {t.jointDetect ? "已开启" : "已关闭"}
      </HmiButton>

      {/* R2 接头长度设置 / 计算 */}
      <Text x={LABEL_X} y={rowY(1)} w={LABEL_W} h={ROW_H} size={40}>
        接头长度设置：
      </Text>
      <NumberField
        x={CTL_X}
        y={rowY(1)}
        w={CTL_W}
        h={ROW_H}
        value={state.jointLength}
        onChange={(v) => set("jointLength", v)}
      />
      <Text x={UNIT_X} y={rowY(1)} w={UNIT_W} h={ROW_H} size={30}>
        袋
      </Text>
      <Text x={CALC_X} y={rowY(1)} w={CALC_W} h={ROW_H} size={40}>
        计算：
      </Text>
      <Readout
        x={VALUE_X}
        y={rowY(1)}
        w={VALUE_W}
        h={ROW_H}
        value={state.jointSeconds}
        digits={3}
        align="center"
      />
      <Text x={SEC_X} y={rowY(1)} w={SEC_W} h={ROW_H} size={30}>
        秒
      </Text>

      {/* R3 接头异常处理：两个模式按钮同尺寸、同间距 */}
      <Text x={LABEL_X} y={rowY(2)} w={LABEL_W} h={ROW_H} size={40}>
        接头异常处理：
      </Text>
      <HmiButton
        x={CTL_X}
        y={rowY(2)}
        w={BTN_W}
        h={ROW_H}
        variant="red"
        color={t.jointMode ? "#000" : undefined}
        onClick={() => set("toggles", { ...t, jointMode: true })}
      >
        延时停机
      </HmiButton>
      <HmiButton
        x={CTL_X + BTN_W + BTN_GAP}
        y={rowY(2)}
        w={BTN_W}
        h={ROW_H}
        variant="red"
        color={!t.jointMode ? "#000" : undefined}
        onClick={() => set("toggles", { ...t, jointMode: false })}
      >
        自动停料
      </HmiButton>

      {/* R4 末行两列的列标题 */}
      <Text x={LABEL_X} y={rowY(3)} w={400} h={ROW_H} size={35}>
        自动停料前袋数设置
      </Text>
      <Text x={COL_B_X} y={rowY(3)} w={336} h={ROW_H} size={35}>
        自动停料袋数设置
      </Text>

      {/* R5 两列数值：左列 x=104 起，右列 x=512 起，列内结构完全一致 */}
      <NumberField
        x={LABEL_X}
        y={rowY(4)}
        w={CTL_W}
        h={ROW_H}
        value={state.stopBeforeBags}
        onChange={(v) => set("stopBeforeBags", v)}
      />
      <Text x={B1_UNIT_X} y={rowY(4)} w={B_UNIT_W} h={ROW_H} size={30}>
        袋
      </Text>
      <Readout
        x={B1_VALUE_X}
        y={rowY(4)}
        w={VALUE_W}
        h={ROW_H}
        value={state.stopBeforeBags}
        digits={3}
        align="center"
      />

      <NumberField
        x={COL_B_X}
        y={rowY(4)}
        w={CTL_W}
        h={ROW_H}
        value={state.stopBags}
        onChange={(v) => set("stopBags", v)}
      />
      <Text x={B2_UNIT_X} y={rowY(4)} w={B_UNIT_W} h={ROW_H} size={30}>
        袋
      </Text>
      <Readout
        x={B2_VALUE_X}
        y={rowY(4)}
        w={VALUE_W}
        h={ROW_H}
        value={state.stopBags}
        digits={3}
        align="center"
      />

      <NavPair />
    </Stage>
  );
}
