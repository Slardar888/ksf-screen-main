import { useNavigate } from "react-router-dom";
import {
  Abs,
  Clock,
  HmiButton,
  NumberField,
  PageHeader,
  Panel,
  Stage,
  Text,
  type Passthrough,
} from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * 管制卡绑定清单（1280×800）
 *
 * 本轮只做「统一标题 + 列对齐 + 纵向节奏 + 同高同起点」，不增删元素、不改文案：
 *
 *  1. 标题：原稿是第二行里的手搓标题 `<Text x={281} y={61} w={768} h={56} size={30}
 *     align="center">管制卡绑定清单</Text>`，现改用全站统一的
 *     `<PageHeader title="管制卡绑定清单" width={1280} />`（底条 y=0 高 56、
 *     标题 50 号居中、右上角时钟）。原稿顶部两行工单信息（生产日期/时间、机台号）
 *     是原稿元素，全部保留，整体下移到标题条之下：第一行 y=64、第二行 y=136。
 *     上行「时间」字段的 Clock 也随该行下移（它就是这个字段的值，不是重复钟）。
 *
 *  2. 纵向节奏（全部取 4 的倍数，全页同一个 GAP=16）：
 *     ROW_H=56、ROW_STEP=72、首行 ROW_Y0=64
 *     —— 10 行 y = 64 / 136 / 208 / 280 / 352 / 424 / 496 / 568 / 640 / 712，
 *     任意相邻两行「下行 y − 上行底边」恒为 16。
 *
 *  3. 列对齐基准：整页是一张两列表单网格
 *     左列 x=32、右列 x=672，字段宽统一 576、标签列宽统一 288
 *     —— 标签列 x/w 全页统一为 32/288 与 672/288，
 *     值列同起点同宽：320/288 与 960/288。
 *     品名+品号、序号+框码绑定码 是原稿的两个一行两字段行，各自占满左右两列。
 *     其余单字段行（班别 / 操作者 / 包材 / 标准袋长 / 装箱量）统一落在左列，
 *     不再像原稿那样 x 在 370/384/512 之间摇摆、宽度 256/512 混用。
 *
 *  4. 同高同起点：Field 的标签与值都和所在行同 y 同高（原来值框是 y+6 / h=50，
 *     比行盒矮一截且下移 6px）；装箱量输入框与所在行同 y 同高；
 *     底部三个按钮统一为 248×80（原稿 250/250/186 三种宽度），间距 16、右缘对齐 1264。
 *
 *  5. 「装箱量」输入框沿用图元库的 NumberField（原稿是 <Abs> 内的裸 <input>，
 *     图元层改成网格后会缩成一小块），仍保留原来的定位盒与黄色数字；
 *     「修改确认」仍是同坐标同尺寸的按钮，点击把当前编辑值写回 store。
 *
 *  6. **标签字号与对齐统一**（本轮）：原稿这一页的标签用了 25 / 30 / 35 / 40
 *     四种字号，对齐方式也是"左对齐 / 居中"混用 —— 同一列里「品名：」比
 *     「生产日期：」大、「序号：」居中而「框码绑定码：」靠左。
 *     现在全页 12 个标签统一为 `LABEL_SIZE = 35` + **左对齐**（托板自带 12 内缩）。
 *     顶部信息条与机台号行原来跟标签同号（25 / 30），只提标签会变成"标签比数值还大"，
 *     所以那两行的数值也一并提到 35，并把格子加宽到刚好容纳
 *     （35 号实测：「生产日期：」175、「时间：」105、时间戳 352.6、
 *     「机台号：」140、「JB301」97.8 设计稿 px）。
 * ------------------------------------------------------------------ */

/** 纵向节奏：四个常数都取 4 的倍数，全页同一个 GAP */
const ROW_H = 56;
const GAP = 16;
const ROW_STEP = ROW_H + GAP; // 72
const ROW_Y0 = 64;
/** 第 n 行（从 0 开始）的 y */
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;

/** 两列表单网格：左列 / 右列，标签列与值列全页统一 */
const FIELD_X = 32;
const COL2_X = 672;
const FIELD_W = 576;
const LABEL_W = 288;
const VALUE_X = FIELD_X + LABEL_W; // 320
const VALUE_W = FIELD_W - LABEL_W; // 288

/**
 * 标签字号：全页**唯一**一档，和全站表单标签同源（MES排程 / 操作画面 /
 * 系统管理员 的 plate 标签都是 35）。
 *
 * 原稿这一页用了 25 / 30 / 35 / 40 四种标签字号，而且有的左对齐、
 * 有的 align="center"，所以同一列里"品名："比"生产日期："大、
 * "序号："居中而"框码绑定码："靠左。现在统一成 35 + 左对齐。
 */
const LABEL_SIZE = 35;

/**
 * 顶部信息条（生产日期 / 时间）与机台号行的单元格。
 * 这两行原来是 25 / 30 号，跟着标签一起提到 35 之后，
 * 原来的格子放不下（实测 35 号下「生产日期：」175、「时间：」105、
 * 时间戳 352.6、「机台号：」140、「JB301」97.8 设计稿 px），
 * 因此把格子加宽到刚好容纳，行内不再有任何文字被压小。
 */
const STRIP_LBL1_X = 0;
/** 托板内可用 220−24＝196 ≥ 180.3（「生产日期：」175 + 0.03em 字距 5.25） */
const STRIP_LBL1_W = 220;
const STRIP_VAL1_X = 220;
/** 减掉 TEXT 的左右各 8 内缩后可用 204 ≥ 196.4（2026-09-11） */
const STRIP_VAL1_W = 220;
const STRIP_LBL2_X = 768;
/** 托板内可用 140−24＝116 ≥ 108.2（「时间：」105 + 3.15） */
const STRIP_LBL2_W = 140;
const STRIP_VAL2_X = 908;
/** 可用 372−16＝356 ≥ 352.6（2026-09-12 12:34:56） */
const STRIP_VAL2_W = 372;

const MACHINE_X = 64;
/** 托板内可用 176−24＝152 ≥ 144.2（「机台号：」140 + 4.2） */
const MACHINE_LBL_W = 176;
const MACHINE_VAL_X = 240;
/** 托板内可用 136−24＝112 ≥ 103（JB301 97.8 + 5.25） */
const MACHINE_VAL_W = 136;

/** 底部操作行：三个按钮同尺寸、间距 16、右缘 1264 */
const BTN_Y = rowY(9); // 712
const BTN_W = 248;
const BTN_H = 80;

function Field({
  x,
  y,
  w,
  labelW,
  label,
  value,
  labelSize = LABEL_SIZE,
  valueSize = 38,
  "data-node-id": nodeId,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  labelW: number;
  label: string;
  value: string;
  labelSize?: number;
  valueSize?: number;
} & Passthrough) {
  return (
    <>
      <Panel x={x} y={y} w={w} h={ROW_H} {...rest} data-node-id={nodeId} />
      <Text x={x} y={y} w={labelW} h={ROW_H} size={labelSize} plate>
        {label}
      </Text>
      <Text x={x + labelW} y={y} w={w - labelW} h={ROW_H} size={valueSize} align="center">
        {value}
      </Text>
    </>
  );
}

export default function BindingCardPage() {
  const navigate = useNavigate();
  const { state, set } = useMachine();
  const c = state.card;

  return (
    <Stage width={1280} height={800}>
      <PageHeader title="管制卡绑定清单" width={1280} />

      {/* 第 1 行：生产日期 / 时间（原来在 y=0 的顶栏里，现下移到标题条之下） */}
      <Panel x={0} y={rowY(0)} w={1280} h={ROW_H} />
      <Text x={STRIP_LBL1_X} y={rowY(0)} w={STRIP_LBL1_W} h={ROW_H} size={LABEL_SIZE} plate>
        生产日期：
      </Text>
      <Text x={STRIP_VAL1_X} y={rowY(0)} w={STRIP_VAL1_W} h={ROW_H} size={LABEL_SIZE} align="center">
        {c.date}
      </Text>
      <Text x={STRIP_LBL2_X} y={rowY(0)} w={STRIP_LBL2_W} h={ROW_H} size={LABEL_SIZE} plate>
        时间：
      </Text>
      <Clock x={STRIP_VAL2_X} y={rowY(0)} w={STRIP_VAL2_W} h={ROW_H} size={LABEL_SIZE} align="left" />

      {/* 第 2 行：机台号 */}
      <Panel x={0} y={rowY(1)} w={1280} h={ROW_H} />
      <Panel x={MACHINE_X} y={rowY(1)} w={MACHINE_LBL_W + MACHINE_VAL_W} h={ROW_H} strong />
      <Text x={MACHINE_X} y={rowY(1)} w={MACHINE_LBL_W} h={ROW_H} size={LABEL_SIZE} plate>
        机台号：
      </Text>
      <Text x={MACHINE_VAL_X} y={rowY(1)} w={MACHINE_VAL_W} h={ROW_H} size={LABEL_SIZE} plate align="center">
        {c.machine}
      </Text>

      {/* 第 3 行：品名 + 品号（原稿一行两字段，左右两列各占一列） */}
      <Field
        x={FIELD_X}
        y={rowY(2)}
        w={FIELD_W}
        labelW={LABEL_W}
        label="品名："
        value={c.productName}
        valueSize={30}
      />
      <Field
        x={COL2_X}
        y={rowY(2)}
        w={FIELD_W}
        labelW={LABEL_W}
        label="品号："
        value={c.productCode}
      />

      {/* 第 4–7 行：班别 / 操作者 / 包材 / 标准袋长（统一落在左列） */}
      <Field x={FIELD_X} y={rowY(3)} w={FIELD_W} labelW={LABEL_W} label="班别：" value={c.shift} />
      <Field x={FIELD_X} y={rowY(4)} w={FIELD_W} labelW={LABEL_W} label="操作者：" value={c.operator} />
      <Field x={FIELD_X} y={rowY(5)} w={FIELD_W} labelW={LABEL_W} label="包材：" value={c.material} />
      <Field x={FIELD_X} y={rowY(6)} w={FIELD_W} labelW={LABEL_W} label="标准袋长：" value={c.stdBagLength} />

      {/* 第 8 行：装箱量 + 修改确认 */}
      <Panel x={FIELD_X} y={rowY(7)} w={FIELD_W} h={ROW_H} />
      <Text x={FIELD_X} y={rowY(7)} w={LABEL_W} h={ROW_H} size={LABEL_SIZE} plate>
        装箱量：
      </Text>
      <Abs x={VALUE_X} y={rowY(7)} w={VALUE_W} h={ROW_H}>
        <NumberField
          x={0}
          y={0}
          w={VALUE_W}
          h={ROW_H}
          color="rgb(248, 231, 28)"
          font="sans"
          value={c.packQty}
          onChange={(v) => set("card", { ...c, packQty: Number(v) || 0 })}
        />
      </Abs>
      <HmiButton
        x={COL2_X}
        y={rowY(7)}
        w={132}
        h={ROW_H}
        variant="green"
        color="#000"
        onClick={() => set("card", { ...c, packQty: Number(c.packQty) || 0 })}
      >
        修改确认
      </HmiButton>

      {/* 第 9 行：序号 + 框码绑定码 */}
      <Panel x={FIELD_X} y={rowY(8)} w={FIELD_W} h={ROW_H} />
      <Text x={FIELD_X} y={rowY(8)} w={LABEL_W} h={ROW_H} size={LABEL_SIZE} plate>
        序号：
      </Text>
      <Text x={VALUE_X} y={rowY(8)} w={VALUE_W} h={ROW_H} size={40} align="center">
        {c.serial}
      </Text>
      <Panel x={COL2_X} y={rowY(8)} w={FIELD_W} h={ROW_H} />
      <Text x={COL2_X} y={rowY(8)} w={LABEL_W} h={ROW_H} size={LABEL_SIZE} plate>
        框码绑定码：
      </Text>

      {/* 第 10 行：底部操作（三个按钮同尺寸，左起 488 / 752 / 1016，间距 16、右缘 1264） */}
      <HmiButton x={488} y={BTN_Y} w={BTN_W} h={BTN_H} variant="blue">
        返回上一页
      </HmiButton>
      <HmiButton x={752} y={BTN_Y} w={BTN_W} h={BTN_H} variant="blue">
        夹酱率
      </HmiButton>
      <HmiButton
        x={1016}
        y={BTN_Y}
        w={BTN_W}
        h={BTN_H}
        variant="blue"
        onClick={() => navigate(ROUTES.home)}
      >
        返回主页
      </HmiButton>
    </Stage>
  );
}
