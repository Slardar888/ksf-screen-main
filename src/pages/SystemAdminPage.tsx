import { useNavigate } from "react-router-dom";
import {
  Abs,
  HmiButton,
  NumberField,
  PageHeader,
  Panel,
  Readout,
  Stage,
  Text,
  type Passthrough,
} from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * 系统管理员 · 参数设定（1280×800）
 *
 * 本轮只做「统一标题 + 三列对齐 + 纵向节奏 + 单元格尺寸统一」，不增删元素：
 *
 *  1. 标题：删掉原稿手搓的两条 Panel（`x=0,y=5,w=1280,h=32` 与 `x=0,y=37,…h=56`）
 *     和标题 Text，改用 `<PageHeader title="【系统管理员】参数设定" width={1280} />`
 *     —— 底条 y=0 高 56、标题 50 号居中、右上角时钟。
 *     三个栏目名（系统参数 / 参数限制 / 功能开关）下移到 y=64 起。
 *
 *  2. 三列基准：列宽统一 384、列间距统一 44、左右留白各 20
 *     —— x = 20 / 448 / 876（原稿 21/448/875，21 与 875 不是 4 的倍数，
 *     吸附后三列宽窄不一）。栏目名与所在列**同 x 同宽**、居中。
 *
 *  3. 纵向节奏（全页同一个 GAP，全部取 4 的倍数）：
 *     栏目名 y=64 高 64；GAP=16；ROW_H=88；ROW_STEP=104；首行 ROW_Y0=144。
 *     五行参数行 y = 144 / 248 / 352 / 456 / 560，最后一行是底部泵保养区 664，
 *     即「同一行（y 相同）的三个单元格 y 与高度完全一致，行间距全页相等（恒为 16）」。
 *     泵保养区排在同一个节奏上，因此整页 Panel 逐行步进一致。
 *
 *  4. 单元格尺寸统一：所有参数单元格（含原稿自带的空白占位面板）都是 384×88。
 *     单元格内部也统一（原来的 154/307/110 都不是 4 的倍数，吸附后各列控件错位）：
 *     标签列 x+0 宽 176、控件列 x+176 宽 144、单位列 x+320 宽 104，
 *     三列起点全页一致；输入控件与所在行同 y 同高（原稿是 y+4 / h=57）。
 *     两行式标签用同一 44 行高排布。
 *
 *  5. 数值：底部「当前袋数」原来是用裸 Text 画数字，现改为 Readout
 *     （同 y 同高、列内居中），颜色沿用原稿的 rgb(208, 2, 27)。
 *
 *  6. 按钮：功能开关 144×88（2 个，与所在单元格控件列同起点同高）、
 *     保养确认 168×88、主菜单 168×88；不再传 size（字号已全站统一）。
 *     原稿自带的绿色圆点装饰保留，放到泵保养行下方的左留白处（32×32）。
 * ------------------------------------------------------------------ */

/** 三列：列宽与列间距取 4 的倍数，左右留白各 20（原稿 21/448/875） */
const COL_W = 384;
const COL_X = [20, 448, 876];

/** 纵向节奏 */
const GAP = 16;
const HEADER_Y = 64;
const HEADER_H = 64;
const ROW_H = 88;
const ROW_STEP = ROW_H + GAP; // 104
const ROW_Y0 = HEADER_Y + HEADER_H + GAP; // 144
/** 第 n 行（从 0 开始）的 y */
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;

/** 单元格内部：标签列 / 控件列 / 单位列（全部 4 的倍数，三列共用） */
/**
 * 标签字号：全页唯一一档。
 *
 * 卡点是「加热在不运行时」这个 7 字的多行标签：25 号需要 180.25 + 托板 21.6
 * = 202，所以标签格必须 ≥ 204；30 号需要 240，格子怎么摆都放不下
 * （这一列 标签+控件+单位 总宽 384，控件至少要 100 才能显示三位数）。
 * 因此全页标签统一到 25 —— 原来 30/25/20/35 四档混用。
 */
const LABEL_SIZE = 25;
const LABEL_W = 208; // 可用 186.4 ≥ 180.25
/**
 * 控件列 144 → 112：标签列加宽的 32px 全部从控件列让出来，
 * 三列合计仍是 208+112+104 = 424（与原实现一致，未新增溢出）。
 * 三位数在 34 号下约需 61px，格子 112 扣掉 CTL 的 12×2 与 INPUT 的
 * 0.2em×2 ≈ 74.4，仍然放得下；且 NumberField 无自适应降档，字号不会变小。
 */
const FIELD_W = 112;
const UNIT_W = 104;

function ParamCell({
  x,
  y,
  label,
  unit,
  value,
  onChange,
  on,
  onToggle,
  labelLines,
  "data-node-id": nodeId,
  ...rest
}: {
  x: number;
  y: number;
  label?: string;
  unit?: string;
  value?: number;
  onChange?: (v: number) => void;
  on?: boolean;
  onToggle?: () => void;
  labelLines?: string[];
} & Passthrough) {
  // 原版面自带「空白占位面板」：不传 label / labelLines / onToggle 且 value 为空时，
  // 只渲染一个空 Panel。这是原始版面元素，保留，尺寸与其它单元格完全一致。
  // 注意占位分支也要带上 {...rest}，否则这一格的 node-id 同样会丢。
  if (!label && !labelLines && !onToggle && value === undefined) {
    return <Panel x={x} y={y} w={COL_W} h={ROW_H} {...rest} data-node-id={nodeId} />;
  }

  return (
    <>
      <Panel x={x} y={y} w={COL_W} h={ROW_H} {...rest} data-node-id={nodeId} />
      {labelLines ? (
        <Abs x={x} y={y} w={LABEL_W} h={ROW_H}>
          {labelLines.map((line, i) => (
            <Text
              key={line}
              x={0}
              y={i * 44}
              w={LABEL_W}
              h={44}
              size={LABEL_SIZE}
              plate
            >
              {line}
            </Text>
          ))}
        </Abs>
      ) : (
        <Text x={x} y={y} w={LABEL_W} h={ROW_H} size={LABEL_SIZE} plate>
          {label}
        </Text>
      )}
      {onToggle ? (
        <HmiButton
          x={x + LABEL_W}
          y={y}
          w={FIELD_W}
          h={ROW_H}
          variant={on ? "green" : "light"}
          color="#000"
          onClick={onToggle}
        >
          {on ? "已开启" : "已关闭"}
        </HmiButton>
      ) : (
        <>
          <NumberField
            x={x + LABEL_W}
            y={y}
            w={FIELD_W}
            h={ROW_H}
            value={value ?? 0}
            onChange={onChange}
          />
          <Text x={x + LABEL_W + FIELD_W} y={y} w={UNIT_W} h={ROW_H} size={30}>
            {unit}
          </Text>
        </>
      )}
    </>
  );
}

export default function SystemAdminPage() {
  const navigate = useNavigate();
  const { state, set, toggle } = useMachine();
  const p = state.sysParams;
  const setP = (key: string, v: number) => set("sysParams", { ...p, [key]: v });

  /** 底部泵保养区：排在同一个行节奏上（第 6 行） */
  const PUMP_Y = rowY(5); // 664

  return (
    <Stage width={1280} height={800}>
      <PageHeader title="【系统管理员】参数设定" width={1280} />

      {/* 三个栏目名：与所在列同 x 同宽、居中 */}
      <Text x={COL_X[0]} y={HEADER_Y} w={COL_W} h={HEADER_H} size={50} weight={400} align="center">
        系统参数
      </Text>
      <Text x={COL_X[1]} y={HEADER_Y} w={COL_W} h={HEADER_H} size={50} weight={400} align="center">
        参数限制
      </Text>
      <Text x={COL_X[2]} y={HEADER_Y} w={COL_W} h={HEADER_H} size={50} weight={400} align="center">
        功能开关
      </Text>

      {/* 系统参数 */}
      <ParamCell x={COL_X[0]} y={rowY(0)} label="辊轴常数：" unit="mm" value={p.rollerConst} onChange={(v) => setP("rollerConst", v)} />
      <ParamCell x={COL_X[0]} y={rowY(1)} label="停机位置：" unit="度" value={p.stopPos} onChange={(v) => setP("stopPos", v)} />
      <ParamCell x={COL_X[0]} y={rowY(2)} />
      <ParamCell x={COL_X[0]} y={rowY(3)} />
      <ParamCell x={COL_X[0]} y={rowY(4)} />

      {/* 参数限制 */}
      <ParamCell x={COL_X[1]} y={rowY(0)} label="速度上限：" unit="袋/min" value={p.speedMax} onChange={(v) => setP("speedMax", v)} />
      <ParamCell x={COL_X[1]} y={rowY(1)} label="速度下限：" unit="袋/min" value={p.speedMin} onChange={(v) => setP("speedMin", v)} />
      <ParamCell x={COL_X[1]} y={rowY(2)} label="袋长上限：" unit="mm/袋" value={p.bagLenMax} onChange={(v) => setP("bagLenMax", v)} />
      <ParamCell x={COL_X[1]} y={rowY(3)} label="袋长下限：" unit="mm/袋" value={p.bagLenMin} onChange={(v) => setP("bagLenMin", v)} />
      <ParamCell
        x={COL_X[1]}
        y={rowY(4)}
        labelLines={["加热在不运行时", "自动关闭时间"]}
        unit="分钟"
        value={p.heatOffMinutes}
        onChange={(v) => setP("heatOffMinutes", v)}
      />

      {/* 功能开关 */}
      <ParamCell
        x={COL_X[2]}
        y={rowY(0)}
        label="温度异常停机"
        on={state.toggles.tempStop}
        onToggle={() => toggle("tempStop")}
      />
      <ParamCell x={COL_X[2]} y={rowY(1)} />
      <ParamCell
        x={COL_X[2]}
        y={rowY(2)}
        label="输膜报警："
        on={state.toggles.filmAlarm}
        onToggle={() => toggle("filmAlarm")}
      />
      <ParamCell x={COL_X[2]} y={rowY(3)} />
      <ParamCell x={COL_X[2]} y={rowY(4)} />

      {/* 泵保养（第 6 行：与上方各行同一个 GAP=16） */}
      <Abs x={0} y={760} w={32} h={32}>
        {/*
          原始实现里这个圆点是 <Abs> 内的裸 <div className="h-full w-full …">。
          图元层改成网格后，裸 div 会落进父容器的子网格第 1 格，
          因此这里显式让它铺满父容器（gridArea 1/1/-1/-1），
          颜色与 class 均与原始实现一致。
        */}
        <div
          className="h-full w-full rounded-full"
          style={{
            gridArea: "1 / 1 / -1 / -1",
            background: "radial-gradient(circle at 35% 30%, #b7ff9c, #35c33c 60%, #147b18)",
          }}
        />
      </Abs>
      <Panel x={20} y={PUMP_Y} w={476} h={ROW_H} />
      <Abs x={20} y={PUMP_Y} w={280} h={ROW_H} style={{ background: "rgb(13, 38, 85)" }}>
        <Text x={0} y={0} w={280} h={ROW_H} size={30} align="center">
          泵保养袋数设置：
        </Text>
      </Abs>
      <NumberField
        x={300}
        y={PUMP_Y}
        w={196}
        h={ROW_H}
        value={p.pumpMaintainBags}
        onChange={(v) => setP("pumpMaintainBags", v)}
      />
      <Panel x={512} y={PUMP_Y} w={COL_W} h={ROW_H} />
      <Text x={512} y={PUMP_Y} w={192} h={ROW_H} size={LABEL_SIZE} plate>
        当前袋数：
      </Text>
      <Readout
        x={704}
        y={PUMP_Y}
        w={192}
        h={ROW_H}
        value={state.currentPumpBags}
        digits={3}
        align="center"
        color="rgb(208, 2, 27)"
      />
      <HmiButton x={912} y={PUMP_Y} w={168} h={ROW_H} variant="light" onClick={() => set("currentPumpBags", 0)}>
        保养确认
      </HmiButton>
      <HmiButton
        x={1096}
        y={PUMP_Y}
        w={168}
        h={ROW_H}
        variant="blueTop"
        onClick={() => navigate(ROUTES.home)}
      >
        主菜单
      </HmiButton>
    </Stage>
  );
}
