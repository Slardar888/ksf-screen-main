import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Clock,
  HmiButton,
  NumberField,
  PageHeader,
  Panel,
  Stage,
  Text,
  type Passthrough,
} from "@/components/hmi/primitives";
import { CTL, INPUT } from "@/components/hmi/styles";
import { ROUTES } from "@/components/hmi/shared";
import { useMachine } from "@/store";
import type { MachineState } from "@/store";

/* ------------------------------------------------------------------ *
 * MES 计划排程（1920×1080）
 *
 * 只调坐标 / 尺寸做统一，文案、元素数量与顺序全部不变：
 *
 *  1. 标题：原稿手搓的
 *     `<Text x={480} y={81} w={768} h={76} size={40} align="center">计划排程</Text>`
 *     换成统一标题条 `<PageHeader title="计划排程" width={1920} />`
 *     （y=0、高 56、字号 50、居中、右上角时钟）。原「日期/时间」「机台号」
 *     两条信息带与整个内容区随之下移到标题条之下。
 *
 *  2. 纵向节奏：全页统一 GAP=32；信息带高 64、明细行高 96、行步长 128、
 *     明细首行 y=376、底部按钮 y=888 高 96 —— ROW_H / GAP / ROW_STEP / GRID_Y0
 *     以及所有带 y 都取 4 的倍数，避免被 4px 对齐网格吸附出 30/34 交替的间距。
 *     信息带 y = 88 / 184 / 280，带间距与行间距同为 32，全页节奏一致。
 *
 *  3. 列对齐基准：横向 3 列等宽 576、列间距 48、左右留白 48
 *     → 列 x = 48 / 672 / 1296（1920 = 48 + 576 + 48 + 576 + 48 + 576 + 48）。
 *     列内「标签列」统一 x=列首、宽 288；「控件列」统一 x=列首+288、宽 288。
 *     顶部「机台号 / 班别 / 当日排程」三行与明细三列共用同一套 x / 宽，
 *     底部两个按钮也落在第 3 列的 1296 / 1600 上，全页只有一套竖向基准线。
 *
 *  4. 尺寸统一：信息带一律 1920×64；明细行一律 576×96、标签 288×96、
 *     控件盒 288×96；「获取订单 / 确认排程」同为 264×64；
 *     「返回主页 / 下一页」同为 264×96；同类按钮同尺寸、间距同为 48，
 *     且 264 × 2 + 48 = 576，按钮组正好铺满第 3 列。
 *
 *  5. 输入控件：数值字段（标准机速 / 标准袋长 / 重量 / 装箱量 / 重量下限 /
 *     重量上限）改用图元 <NumberField>，盒子与所在行同高（96），控件外框由图元
 *     统一成 56 高并在行内垂直居中。品号 / 工单号 / 操作者 / 包材 / 机台号在
 *     store 里是字符串（含中文与字母），NumberField 会把输入强制转成 number，
 *     因此只能保留原生 <input>，但同样套 .hmi-ctl（高 56、字号走 --fs-input）
 *     并在行内垂直居中；两个原生 <select> 同理。按钮不再传 size（字号全站统一）。
 * ------------------------------------------------------------------ */

type Schedule = MachineState["schedule"];

/* ---------------- 纵向节奏（全部 4 的倍数） ---------------- */

/** 统一标题条高度（PageHeader 内置，这里只用来推第一条信息带的 y） */
const TITLE_H = 56;
/** 全页统一的带间距 / 行间距 */
const GAP = 32;
/** 信息带高度（日期时间 / 机台号 / 订单选择 三条一致） */
const BAND_H = 64;
/** 第一条信息带 y：56 + 32 = 88 */
const BAND_Y0 = TITLE_H + GAP;
/** 第 i 条信息带的 y → 88 / 184 / 280 */
const bandY = (i: number) => BAND_Y0 + i * (BAND_H + GAP);

/** 明细行高与行步长 */
const ROW_H = 96;
const ROW_STEP = ROW_H + GAP; // 128
/** 明细区首行 y：第 3 条信息带底 344 + GAP = 376 */
const GRID_Y0 = bandY(2) + BAND_H + GAP;
/** 第 r 行明细的 y → 376 / 504 / 632 / 760 */
const rowY = (r: number) => GRID_Y0 + r * ROW_STEP;
/** 明细区高度（4 行 + 3 个行间距） */
const GRID_ROWS = 4;
const GRID_H = GRID_ROWS * ROW_STEP - GAP; // 480
/** 底部按钮带 y：明细底 856 + GAP = 888 */
const FOOT_Y = GRID_Y0 + GRID_H + GAP;
const FOOT_H = 96;

/* ---------------- 列对齐基准（全部 4 的倍数） ---------------- */

/** 左右留白与列间距 */
const MARGIN = 48;
const COL_GAP = 48;
/** 三列等宽：1920 = 48 + 3*576 + 2*48 + 48 */
const COL_W = 576;
/** 第 i 列的 x → 48 / 672 / 1296 */
const COL_X = (i: number) => MARGIN + i * (COL_W + COL_GAP);
/** 列内标签列宽 / 控件列宽（各占一半，与列首对齐） */
const LABEL_W = 288;
const CTL_W = 288;

/**
 * 同类按钮统一宽度。取 264 而不是 272，是因为两个按钮 + 一个列间距
 * 要正好铺满一列：264 × 2 + 48 = 576 = COL_W，按钮组的左右缘与列缘重合，
 * 行内所有横向间距都等于 COL_GAP=48（原来 272 宽时按钮间距只有 32，
 * 与列间距 48 不等，全页出现 48/48/32 三种节奏）。
 */
const BTN_W = 264;

/** 排程明细中的一行：面板 + 标签 + 文本输入 */
function Row({
  col,
  row,
  label,
  value,
  onChange,
  "data-node-id": nodeId,
  ...rest
}: {
  col: number;
  row: number;
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Passthrough) {
  const x = COL_X(col);
  const y = rowY(row);
  return (
    <>
      <Panel x={x} y={y} w={COL_W} h={ROW_H} {...rest} data-node-id={nodeId} />
      <Text x={x} y={y} w={LABEL_W} h={ROW_H} size={35} plate>
        {label}
      </Text>
      {/* 控件盒与整行同高，.hmi-ctl（高 56）在盒内垂直居中 */}
      <Box x={x + LABEL_W} y={y} w={CTL_W} h={ROW_H} className="flex items-center">
        <div className={CTL}>
          <input
            className={INPUT}
            style={{ color: "var(--color-hmi-set)", fontFamily: "var(--font-ui)" }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </Box>
    </>
  );
}

/** 排程明细中的一行：面板 + 标签 + 数值输入（图元 NumberField） */
function NumRow({
  col,
  row,
  label,
  value,
  onChange,
  "data-node-id": nodeId,
  ...rest
}: {
  col: number;
  row: number;
  label: string;
  value: string;
  onChange: (v: number) => void;
} & Passthrough) {
  const x = COL_X(col);
  const y = rowY(row);
  return (
    <>
      <Panel x={x} y={y} w={COL_W} h={ROW_H} {...rest} data-node-id={nodeId} />
      <Text x={x} y={y} w={LABEL_W} h={ROW_H} size={35} plate>
        {label}
      </Text>
      <NumberField
        x={x + LABEL_W}
        y={y}
        w={CTL_W}
        h={ROW_H}
        color="var(--color-hmi-set)"
        value={value}
        onChange={onChange}
      />
    </>
  );
}

export default function MesSchedulePage() {
  const navigate = useNavigate();
  const { state, set } = useMachine();
  const [filled, setFilled] = useState(false);

  /** 本地草稿：排程明细始终可编辑并回显，只有「确认排程」才写回 store */
  const [draft, setDraft] = useState<Schedule>(() => ({ ...state.schedule }));
  /** 「当日排程」下拉的本地选中项（原实现 onChange 为空函数） */
  const [order, setOrder] = useState("");

  const update = (patch: Partial<Schedule>) => setDraft((d) => ({ ...d, ...patch }));

  /** 当日排程：品号-班别（与原实现的下拉文案一致） */
  const orderName = `${draft.productCode}-${draft.shift === "当前班" ? "早" : draft.shift}`;
  /** 下拉当前值：未获取订单时为空（与原实现一致） */
  const orderValue = filled ? order || orderName : "";

  const today = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;

  return (
    <Stage width={1920} height={1080}>
      <PageHeader title="计划排程" width={1920} />

      {/* 信息带 1：日期 / 时间 */}
      <Panel x={0} y={BAND_Y0} w={1920} h={BAND_H} />
      <Text x={MARGIN} y={BAND_Y0} w={136} h={BAND_H} size={25}>
        日期：
      </Text>
      <Text x={MARGIN + 136} y={BAND_Y0} w={280} h={BAND_H} size={23}>
        {dateStr}
      </Text>
      <Text x={1200} y={BAND_Y0} w={152} h={BAND_H} size={25}>
        时间：
      </Text>
      <Clock x={1352} y={BAND_Y0} w={520} h={BAND_H} size={25} align="left" />

      {/* 信息带 2：机台号（与明细第 1 列共用同一条列基准） */}
      <Panel x={0} y={bandY(1)} w={1920} h={BAND_H} />
      <Panel x={COL_X(0)} y={bandY(1)} w={COL_W} h={BAND_H} strong />
      <Text x={COL_X(0)} y={bandY(1)} w={LABEL_W} h={BAND_H} size={35} plate>
        机台号：
      </Text>
      <Box x={COL_X(0) + LABEL_W} y={bandY(1)} w={CTL_W} h={BAND_H} className="flex items-center">
        <div className={CTL}>
          <input
            className={INPUT}
            style={{ fontFamily: "var(--font-ui)" }}
            value={draft.machine}
            onChange={(e) => update({ machine: e.target.value })}
          />
        </div>
      </Box>

      {/* 信息带 3：订单选择（班别 / 当日排程 / 获取订单 / 确认排程） */}
      <Panel x={COL_X(0)} y={bandY(2)} w={COL_W} h={BAND_H} />
      <Text x={COL_X(0)} y={bandY(2)} w={LABEL_W} h={BAND_H} size={35} plate>
        班别：
      </Text>
      <Box x={COL_X(0) + LABEL_W} y={bandY(2)} w={CTL_W} h={BAND_H} className="flex items-center">
        <div className={CTL}>
          <select
            className={`${INPUT} appearance-none`}
            style={{ fontFamily: "var(--font-ui)" }}
            value={draft.shift}
            onChange={(e) => update({ shift: e.target.value })}
          >
            <option className="text-black" value="当前班">
              当前班
            </option>
            <option className="text-black" value="早">
              早
            </option>
            <option className="text-black" value="中">
              中
            </option>
            <option className="text-black" value="晚">
              晚
            </option>
          </select>
        </div>
      </Box>

      <Panel x={COL_X(1)} y={bandY(2)} w={COL_W} h={BAND_H} />
      <Text x={COL_X(1)} y={bandY(2)} w={LABEL_W} h={BAND_H} size={35} plate>
        当日排程：
      </Text>
      <Box x={COL_X(1) + LABEL_W} y={bandY(2)} w={CTL_W} h={BAND_H} className="flex items-center">
        <div className={CTL}>
          <select
            className={`${INPUT} appearance-none`}
            style={{ fontFamily: "var(--font-ui)" }}
            value={orderValue}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option className="text-black" value={orderValue}>
              {filled ? orderName : "请选择"}
            </option>
          </select>
        </div>
      </Box>

      <HmiButton
        x={COL_X(2)}
        y={bandY(2)}
        w={BTN_W}
        h={BAND_H}
        variant="green"
        color="rgb(65, 84, 185)"
        onClick={() => {
          // 「获取订单」：把 store 里的排程值填入本地草稿
          setDraft({ ...state.schedule });
          setOrder("");
          setFilled(true);
        }}
      >
        获取订单
      </HmiButton>
      {/*
        「确认排程」原先是一个手搓的原生 <button>：它写死 fontSize:
        calc(var(--u) * var(--fs-btn))，而 --fs-btn 这个令牌在全项目里
        根本没有定义 → 整条 font-size 失效，字号退回浏览器默认的 16px，
        比同排的「获取订单」小了一大截；又因为没有 data-btn，
        所有审计脚本都扫不到它，问题一直没被发现。
        现在改用图元 <HmiButton variant="purple">：字号与全站按钮同源
        （BTN 的 28 号 + useFitText 同档位自适应）、同样带 BTN_PAD 内边距、
        同样带 data-btn 供审计覆盖；紫色渐变与原样式逐字对应。
      */}
      <HmiButton
        x={COL_X(2) + BTN_W + COL_GAP}
        y={bandY(2)}
        w={BTN_W}
        h={BAND_H}
        variant="purple"
        onClick={() => {
          // 「确认排程」：把本地草稿写回 store（原实现此按钮没有行为）
          set("schedule", { ...draft });
        }}
      >
        确认排程
      </HmiButton>

      {/* 排程明细：3 列等宽，列内行 y / 高 / 标签列 / 控件列完全一致 */}
      <Row col={0} row={0} label="品号：" value={draft.productCode} onChange={(v) => update({ productCode: v })} />
      <Row col={0} row={1} label="工单号：" value={draft.workOrder} onChange={(v) => update({ workOrder: v })} />
      <Row col={0} row={2} label="操作者：" value={draft.operator} onChange={(v) => update({ operator: v })} />
      <NumRow col={0} row={3} label="标准机速：" value={draft.stdSpeed} onChange={(v) => update({ stdSpeed: String(v) })} />

      <Row col={1} row={0} label="包材：" value={draft.package} onChange={(v) => update({ package: v })} />
      <NumRow col={1} row={1} label="标准袋长：" value={draft.stdBagLength} onChange={(v) => update({ stdBagLength: String(v) })} />
      <NumRow col={1} row={2} label="重量：" value={draft.weight} onChange={(v) => update({ weight: String(v) })} />
      <NumRow col={1} row={3} label="装箱量：" value={draft.packQty} onChange={(v) => update({ packQty: String(v) })} />

      <NumRow col={2} row={0} label="重量下限：" value={draft.weightLow} onChange={(v) => update({ weightLow: String(v) })} />
      <NumRow col={2} row={1} label="重量上限：" value={draft.weightHigh} onChange={(v) => update({ weightHigh: String(v) })} />

      {/* 确认下发：两个同类按钮同尺寸 264×96、间距 48（=COL_GAP）、正好铺满第 3 列 */}
      <HmiButton
        x={COL_X(2)}
        y={FOOT_Y}
        w={BTN_W}
        h={FOOT_H}
        onClick={() => navigate(ROUTES.home)}
      >
        返回主页
      </HmiButton>
      <HmiButton
        x={COL_X(2) + BTN_W + COL_GAP}
        y={FOOT_Y}
        w={BTN_W}
        h={FOOT_H}
        onClick={() => navigate(ROUTES.io)}
      >
        下一页
      </HmiButton>
    </Stage>
  );
}
