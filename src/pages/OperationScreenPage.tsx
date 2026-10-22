import { useNavigate } from "react-router-dom";
import { ArrowButton, HmiButton, NumberField, Panel, Readout, ScreenHeader, Stage, Stepper, StatusButton, Text } from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import type { Passthrough } from "@/components/hmi/primitives";
import { useMachine } from "@/store";
import { useTag } from '@kesi/client';
/* ------------------------------------------------------------------ *
 * 操作画面（1280×800）
 *
 * 版面结构沿用原设计稿，但做了**统一节奏**的整理：
 *
 *  1. 纵向节奏：行高 62、行距 20、首行 y=122 → 行距 82
 *     R1 122 速度设置 / R2 204 袋长设置 / R3 286 产量计数 / R4 368 辊筒计数
 *     R5 450 功能开关 / R6 532 温度上排 / R7 614 温度下排 / 底部动作条 696
 *     左右两列共用同一个 20px 间距。
 *  2. 标签列统一 x=10 / 宽 230（原计数行是 240，比其它行宽 10px）。
 *  3. 数值在各自区域内**居中**；输入控件与所在行**垂直居中**对齐
 *     （原 Stepper 在 y=124、NumberField 在 y=112 都比所在行偏下）。
 *  4. 底部动作条 5 个按钮间距统一为 70。
 * ------------------------------------------------------------------ */
/**
 * 统一的纵向节奏。
 * 三个常数**都取 4 的倍数**：图元会把每条边吸附到 4px 对齐网格，
 * 若步长不是 4 的倍数（如 82），吸附后行距会在 18/22 之间交替，看上去就"不相等"。
 */
const ROW_H = 64;
const GAP = 20;
const ROW_STEP = ROW_H + GAP; // 84（4 的倍数）
const ROW_Y0 = 124;
/** 第 n 行（从 0 开始）的 y */
const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;
/** 右列：标题条与箭头行的高度（同样取 4 的倍数） */
const TITLE_H = 60;
const ARROW_H = 88;
/**
 * 右列两条竖向基准线：子列 1 = 968..1116、子列 2 = 1124..1272（间距 8）。
 * 标题条、数值框、四个箭头按钮全部只落在这两条线上 ——
 * 原来的标题条宽 144（右缘 1112）、数值框起点 1116（右缘 1264），
 * 与箭头列的 1116 / 1272 差 4~8px，右列出现三条"差一点点"的竖线。
 */
const R_COL_X1 = 968;
const R_COL_X2 = 1124;
const R_COL_W = 148;
/**
 * 右列标题行（色标位 / 冷封位）内部如何切分。
 *
 * 原来标签格只有 148（与箭头列同宽），6 个字的「色标位调整：」放不下：
 * 35 号要 194.8、30 号要 167、25 号要 139，而格子扣掉托板 21.6 只剩 126.4，
 * 所以 `useFitText` 只能一路降到 20 号 —— 全页 10 个标签 35、这 2 个 20，
 * 这就是用户看到的"标签大小不一致"。
 *
 * 关键约束是数值框不能太窄：输入框字号是 `INPUT` 类里写死的 34 号，
 * `NumberField` **没有**自适应降档（`useFitText` 只用在 Text / HmiButton 上），
 * 所以格子太窄不会变小，而是三位数会被截断。实测 3 位数在 34 号下约需
 * 61px，加上 CTL 的 12×2 与 INPUT 的 0.2em×2 ≈ 98.6 → 取 100。
 * 于是标签格 = 304 − 8 − 100 = 196（可用 174.4 ≥ 167 ✓）。
 */
const R_TITLE_LBL_W = 196;
const R_FIELD_X = R_COL_X1 + R_TITLE_LBL_W + 8; // 1172
const R_FIELD_W = 100; // 1172 + 100 = 1272 = 右列右缘
/**
 * 全页标签唯一字号。
 * 右列两个标签的格子最多只能容下 30 号（见 R_TITLE_LBL_W 的推导），
 * 因此整页标签统一到 30 —— 原来 10 个 35、2 个 20。
 */
const LABEL_SIZE = 30;
/** 右列各段的 y，间距与左列同为 GAP */
const R_TITLE1 = ROW_Y0; // 124
const R_ARROWS1 = R_TITLE1 + TITLE_H + GAP; // 204
const R_ARROWS2 = R_ARROWS1 + ARROW_H + GAP; // 312
const R_TITLE2 = R_ARROWS2 + ARROW_H + GAP; // 420
const R_ARROWS3 = R_TITLE2 + TITLE_H + GAP; // 500
const R_ARROWS4 = R_ARROWS3 + ARROW_H + GAP; // 608
/** 底部动作条 */
const BAR_Y = ROW_Y0 + 6 * ROW_STEP + ROW_H + GAP; // 712
const BAR_H = 80;
/** 标签列 / 数值列的统一定位 */
const LABEL_X = 10;
const LABEL_W = 230;
const VALUE_X = LABEL_X + LABEL_W; // 240
/**
 * 三个行组件都是**组件**而不是"返回 JSX 的函数"：
 * 只有 JSX 元素才会被 `@kesi/vite-plugin` 注入 `data-node-id`，
 * 写成 `{row(...)}` 时调用点上没有元素可挂 id，工具就定位不到。
 *
 * 另外它们必须把自己的 `data-node-id` **显式声明**在第一个根元素上：
 * 插件给元素追加 id 时写在属性列表最后
 *
 *   jsxDEV(Panel, { x, y, w, h, ...rest, "data-node-id": "node-<组件内部那个Panel>" })
 *                                   ↑ 调用点透传的            ↑ 插件注入的，在后面 → 覆盖上面
 *
 * 所以单靠 `{...rest}` 会被顶掉。而插件的规则是"元素已经声明了 data-node-id 就跳过"
 * （见 @kesi/vite-plugin dist 里 JSXAttribute 名为 data-node-id 的 hasId 判断），
 * 因此这里先把 `data-node-id` 取出来、再显式写回去，插件就不再覆盖，
 * 调用点的 id 才能落到 DOM 上。
 */
/** 一行「标签 + 数值」 */
function Row({ y, label, value, "data-node-id": nodeId, ...rest }: {
  y: number;
  label: string;
  value: number;
} & Passthrough) {
  return (<>
      <Panel x={LABEL_X} y={y} w={461} h={ROW_H} {...rest} data-node-id={nodeId} />
      <Text x={LABEL_X} y={y} w={LABEL_W} h={ROW_H} size={LABEL_SIZE} plate>
        {label}
      </Text>
      <Readout x={VALUE_X} y={y} w={LABEL_W} h={ROW_H} value={value} digits={1} align="center" />
    </>);
}
/** 半宽的温度行（纵封 / 横封 并排） */
function TempRow({ y, x, label, value, "data-node-id": nodeId, ...rest }: {
  y: number;
  x: number;
  label: string;
  value: number;
} & Passthrough) {
  return (<>
      <Panel x={x} y={y} w={461} h={ROW_H} {...rest} data-node-id={nodeId} />
      <Text x={x} y={y} w={LABEL_W} h={ROW_H} size={LABEL_SIZE} plate>
        {label}
      </Text>
      <Readout x={x + LABEL_W} y={y} w={LABEL_W} h={ROW_H} value={value} digits={1} align="center" />
    </>);
}
/**
 * 计数行：标签 + 数值 + 单位 + 清零。
 *
 * 关键：数值格必须与其它行**同宽同起点**（都用 VALUE_X / LABEL_W），
 * 这样"居中"才有共同的对称轴 —— 否则格子宽度不同，居中后数值中心错开，
 * 上下就对不齐了。
 * 单位「袋」靠面板右缘（原位置）；「清零」保持原实现的位置，浮在面板之外。
 */
function Counter({ y, label, value, onReset, "data-node-id": nodeId, ...rest }: {
  y: number;
  label: string;
  value: number;
  onReset: () => void;
} & Passthrough) {
  return (<>
      <Panel x={LABEL_X} y={y} w={750} h={ROW_H} {...rest} data-node-id={nodeId} />
      <Text x={LABEL_X} y={y} w={LABEL_W} h={ROW_H} size={LABEL_SIZE} plate>
        {label}
      </Text>
      <Readout x={VALUE_X} y={y} w={LABEL_W} h={ROW_H} value={value} digits={3} align="center" />
      <Text x={680} y={y} w={72} h={ROW_H} size={26}>
        袋
      </Text>
      <HmiButton x={799} y={y} w={144} h={ROW_H} variant="yellow" size={30} onClick={onReset}>
        清 零
      </HmiButton>
    </>);
}
export default function OperationScreenPage() {
  const navigate = useNavigate();
  const { state, set, toggle, resetCount } = useMachine();
  const t = state.toggles;
  return (<Stage width={1280} height={800}>
      <ScreenHeader title="操作画面" titleSize={50} width={1280} showNumber={false} />

      {}
      <Row y={rowY(0)} label="速度设置：" value={useTag({ tableId: 'bp_ev58f855a8_meter', dataId: 'EF855A8-F2-EM-02', tagId: 'ep', field: 'value' })} />
      <Panel x={490} y={rowY(0)} w={461} h={ROW_H} />
      <Stepper x={490} y={rowY(0)} w={230} h={ROW_H} value={state.speedSet} digits={1} step={0.1} min={state.sysParams.speedMin} max={state.sysParams.speedMax} onChange={(v) => set("speedSet", v)} />
      <Text x={720} y={rowY(0)} w={230} h={ROW_H} size={LABEL_SIZE} plate>
        袋/分钟
      </Text>

      {}
      <Row y={rowY(1)} label="袋长设置：" value={state.bagLengthSet} />
      <Panel x={490} y={rowY(1)} w={461} h={ROW_H} />
      <Stepper x={490} y={rowY(1)} w={230} h={ROW_H} value={state.bagLengthSet} digits={1} step={0.1} min={state.sysParams.bagLenMin} max={state.sysParams.bagLenMax} onChange={(v) => set("bagLengthSet", v)} />
      <Text x={720} y={rowY(1)} w={230} h={ROW_H} size={LABEL_SIZE} plate>
        毫米/袋
      </Text>

      {}
      <Counter y={rowY(2)} label="产量计数：" value={state.outputCount} onReset={() => resetCount("outputCount")} />
      <Counter y={rowY(3)} label="辊筒计数：" value={state.rollerCount} onReset={() => resetCount("rollerCount")} />

      {}
      <Text x={LABEL_X} y={rowY(4)} w={150} h={ROW_H} size={LABEL_SIZE}>
        计数功能：
      </Text>
      <StatusButton x={160} y={rowY(4)} w={144} h={ROW_H} on={t.countFunction} onClick={() => toggle("countFunction")} />
      <Text x={330} y={rowY(4)} w={150} h={ROW_H} size={LABEL_SIZE}>
        回吸功能：
      </Text>
      <StatusButton x={480} y={rowY(4)} w={144} h={ROW_H} on={t.suckBack} onClick={() => toggle("suckBack")} />
      <Text x={650} y={rowY(4)} w={150} h={ROW_H} size={LABEL_SIZE}>
        辊筒计数：
      </Text>
      <StatusButton x={800} y={rowY(4)} w={144} h={ROW_H} on={t.rollerCount} onClick={() => toggle("rollerCount")} />

      {}
      <TempRow y={rowY(5)} x={10} label="纵封内侧：" value={state.sealVInner} />
      <TempRow y={rowY(5)} x={490} label="横封内侧：" value={state.sealHInner} />
      <TempRow y={rowY(6)} x={10} label="纵封外侧：" value={state.sealVOuter} />
      <TempRow y={rowY(6)} x={490} label="横封外侧：" value={state.sealHOuter} />

      {}

      {}
      <Panel x={R_COL_X1} y={R_TITLE1} w={R_COL_W * 2 + 8} h={TITLE_H} />
      <Text x={R_COL_X1} y={R_TITLE1} w={R_TITLE_LBL_W} h={TITLE_H} size={LABEL_SIZE} plate>
        色标位调整：
      </Text>
      <NumberField x={R_FIELD_X} y={R_TITLE1} w={R_FIELD_W} h={TITLE_H} value={state.markPos} onChange={(v) => set("markPos", Math.max(0, Math.round(v)))} />
      <ArrowButton x={R_COL_X1} y={R_ARROWS1} w={R_COL_W} h={ARROW_H} direction="up" onClick={() => set("markPos", state.markPos + 1)} />
      <ArrowButton x={R_COL_X2} y={R_ARROWS1} w={R_COL_W} h={ARROW_H} direction="doubleUp" onClick={() => set("markPos", state.markPos + 10)} />
      <ArrowButton x={R_COL_X1} y={R_ARROWS2} w={R_COL_W} h={ARROW_H} direction="down" onClick={() => set("markPos", Math.max(0, state.markPos - 1))} />
      <ArrowButton x={R_COL_X2} y={R_ARROWS2} w={R_COL_W} h={ARROW_H} direction="doubleDown" onClick={() => set("markPos", Math.max(0, state.markPos - 10))} />

      {}
      <Panel x={R_COL_X1} y={R_TITLE2} w={R_COL_W * 2 + 8} h={TITLE_H} />
      <Text x={R_COL_X1} y={R_TITLE2} w={R_TITLE_LBL_W} h={TITLE_H} size={LABEL_SIZE} plate>
        冷封位调整：
      </Text>
      <NumberField x={R_FIELD_X} y={R_TITLE2} w={R_FIELD_W} h={TITLE_H} value={state.coldPos} onChange={(v) => set("coldPos", Math.max(0, Math.round(v)))} />
      <ArrowButton x={R_COL_X1} y={R_ARROWS3} w={R_COL_W} h={ARROW_H} direction="up" onClick={() => set("coldPos", state.coldPos + 1)} />
      <ArrowButton x={R_COL_X2} y={R_ARROWS3} w={R_COL_W} h={ARROW_H} direction="doubleUp" onClick={() => set("coldPos", state.coldPos + 10)} />
      <ArrowButton x={R_COL_X1} y={R_ARROWS4} w={R_COL_W} h={ARROW_H} direction="down" onClick={() => set("coldPos", Math.max(0, state.coldPos - 1))} />
      <ArrowButton x={R_COL_X2} y={R_ARROWS4} w={R_COL_W} h={ARROW_H} direction="doubleDown" onClick={() => set("coldPos", Math.max(0, state.coldPos - 10))} />

      {}
      <HmiButton x={16} y={BAR_Y} w={192} h={BAR_H} variant="red" size={44} onClick={() => toggle("butterflyValve")}>
        蝶 阀
      </HmiButton>
      <HmiButton x={280} y={BAR_Y} w={192} h={BAR_H} variant="red" size={44} onClick={() => toggle("mark")}>
        色 标
      </HmiButton>
      <HmiButton x={544} y={BAR_Y} w={192} h={BAR_H} variant="red" size={44} onClick={() => toggle("heat")}>
        加 热
      </HmiButton>
      <HmiButton x={808} y={BAR_Y} w={192} h={BAR_H} variant="blue" size={42} onClick={() => navigate(ROUTES.injection)}>
        注料设置
      </HmiButton>
      <HmiButton x={1072} y={BAR_Y} w={192} h={BAR_H} variant="blue" size={44} onClick={() => navigate(ROUTES.home)}>
        主菜单
      </HmiButton>
    </Stage>);
}