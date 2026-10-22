import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ARROW,
  BAR,
  BAR_STRONG,
  BTN,
  BTN_PAD,
  BTN_VARIANT,
  CELL,
  CTL,
  DARKBAR,
  DLG_BTN,
  INPUT,
  LABEL,
  LED_GLOW,
  META_KEY,
  PAGE_TITLE,
  PLATE,
  STAGE,
  STEP,
  SUBGRID,
  TEXT,
  TITLEBAR,
  VALUE,
} from "@/components/hmi/styles";

/* ==================================================================
 * 触摸屏图元库 v4 —— 原坐标 API + 等比网格 + 全站视觉规范
 *
 * 三条铁律：
 *  1. 版面由原坐标决定：所有图元保留原来的 x / y / w / h 入参，
 *     实现走 CSS Grid（不用绝对定位），画布铺满视口。
 *  2. 一致性由令牌决定：字号、控件高度、内边距一律取自 index.css 的
 *     --fs-* / --ctl-h / --pad-* 令牌，图元内部不再各自为政。
 *  3. 文字必须完整显示：任何文字框若宽度不够，按实测比例自动缩小字号，
 *     而不是被 overflow 裁掉。
 * ================================================================== */

/** 网格粒度：每格代表原画布 GRID_STEP px，位置误差 ≤ GRID_STEP/2 */
const GRID_STEP = 2;

/** 对齐网格：所有元素边缘吸附到该值（原设计稿 px），保证成行成列 */
const SPEC = {
  /** 按钮文字：全站唯一（普通按钮） */
  btn: 28,
  /**
   * 主菜单大磁贴的文字：磁贴尺寸 384×189（1920×1080 画布），
   * 沿用普通按钮的 28 会明显偏小，因此单独一档（原稿就是 50）。
   */
  tile: 50,
  /** 数值读数 */
  num: 44,
  /**
   * 输入控件外框高度与字号。CTL / INPUT 两个 Tailwind 类里的
   * h-[calc(var(--u)*56)] 与 text-[calc(var(--u)*34)] 就是这两个值
   * （类名必须是完整字面量，所以那边写死数字，这里保持同源并在此处注明）。
   */
  ctl: 56,
  fsInput: 34,
  /**
   * 页面标题字号与底条高度。单位是"以 1280×800 为基准的设计稿 px"，
   * 由 <Stage> 注入为内联自定义属性 --title-size / --titlebar-h，
   * 标题条再以 calc(var(--ut) * var(--title-size)) 消费。
   * 因为走 --ut（视口相对），所以各页渲染出来的实际像素完全一致。
   */
  title: 37,
  titleBarH: 56,
  /** 坐标对齐网格 */
  align: 4,
} as const;

const ALIGN = SPEC.align;
const snap = (v: number) => Math.round(v / ALIGN) * ALIGN;

/**
 * 字号阶梯：全站只保留这几级。
 * Text 传入的 size 会被归一到最近一级（并列时取较小值，避免放大导致溢出）。
 * 原始页面里的 17 种字号会被收敛成 7 级，同时保持「标题 > 标签 > 说明」的层级。
 */
const TEXT_TIERS = [20, 25, 30, 35, 40, 44, 50, 80];

/**
 * 全站视觉规范（单位 = 原设计稿 px）—— **唯一事实来源**。
 * 因为自适应要按档位做数值比较，所以数值集中在这里；
 * 需要落到 Tailwind 类上的（控件高、输入字号、按钮内边距）以完整字面量
 * 写在 styles.ts 的 CTL / INPUT / BTN_PAD 里，数字与此处保持一致。
 * 任何改动都会被 .workbuddy/spec.mjs 实测校验。
 *
 * 注意：以前这里注释提到的 --ctl-h / --fs-input / --fs-btn / --pad-ctl
 * 这几个 CSS 变量**从未被定义过**，引用它们的地方会整条声明失效
 * （MES「确认排程」按钮就因此退回 16px 浏览器默认字号）。
 * 现已全部改为直接使用本对象里的常量。
 */


function tierText(size: number): number {
  let best = TEXT_TIERS[0];
  let bestD = Infinity;
  for (const t of TEXT_TIERS) {
    const d = Math.abs(t - size);
    if (d < bestD - 1e-9 || (Math.abs(d - bestD) < 1e-9 && t < best)) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

interface CanvasCtxValue {
  /** 当前画布（或子网格容器）在原设计稿中的宽高 —— 用于换算坐标 */
  w: number;
  h: number;
  cols: number;
  rows: number;
}

const CanvasCtx = createContext<CanvasCtxValue | null>(null);

function useCanvas(): CanvasCtxValue {
  const ctx = useContext(CanvasCtx);
  if (!ctx) throw new Error("图元必须放在 <Stage> 内使用");
  return ctx;
}

/** 把原坐标换算成 grid 行/列线号（两条边都吸附到对齐网格） */
function place(
  ctx: CanvasCtxValue,
  x: number,
  y: number,
  w: number,
  h?: number,
): React.CSSProperties {
  const col = (v: number) => Math.round((v / ctx.w) * ctx.cols);
  const row = (v: number) => Math.round((v / ctx.h) * ctx.rows);

  // 左/右、上/下两条边分别吸附，保证相邻元素共享同一条对齐线
  const x0 = snap(x);
  const x1 = Math.max(x0 + ALIGN, snap(x + w));
  const c1 = col(x0);
  const c2 = Math.max(col(x1), c1 + 1);
  const r1 = row(snap(y));

  if (h === undefined) {
    return {
      gridColumn: `${c1 + 1} / ${c2 + 1}`,
      gridRow: `${r1 + 1} / -1`,
      alignSelf: "start",
    };
  }
  const y1 = Math.max(snap(y) + ALIGN, snap(y + h));
  const r2 = Math.max(row(y1), r1 + 1);
  return { gridColumn: `${c1 + 1} / ${c2 + 1}`, gridRow: `${r1 + 1} / ${r2 + 1}` };
}

/** 原设计稿 px → 当前视口尺寸（--u = 1 个设计稿 px，由 Stage 定义） */
function px(v: number | string): string {
  return `calc(var(--u) * ${v})`;
}

/**
 * 文字自适应 —— 三级策略，保证「内容完整」优先，「字号规整」其次：
 *   ① 用规范字号档位 + 规范内边距：能放下就用，全站字号因此始终落在有限几档上；
 *   ② 仍放不下时，牺牲内边距（改为 0）保住字号档位；
 *   ③ 极少数盒子实在太小（如 6 个汉字的标签塞在 123px 宽的格子里），
 *      才按实测比例等比缩小 —— 宁可有几处字号略偏离档位，也不让文字被裁掉。
 *
 * 注意必须扣掉左右内边距再比较，否则永远收敛不到「放得下」。
 */
function useFitText<T extends HTMLElement = HTMLDivElement>(
  candidates: number[],
  watch: string,
) {
  const ref = useRef<T>(null);
  const key = `${candidates.join(",")}|${watch}`;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const cs = getComputedStyle(el);
      return parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    };

    /** 在给定内边距下，从大到小试档位，返回放得下的那一档 */
    // 必须从大到小试，才能拿到"放得下的最大档"
    const desc = [...candidates].sort((a, b) => b - a);

    const tryWith = (pad: string): number | null => {
      el.style.paddingLeft = pad;
      el.style.paddingRight = pad;
      const p = measure();
      const avail = el.clientWidth - p;
      for (const c of desc) {
        el.style.fontSize = px(c);
        // 纵向判据：字号不得高于盒高（网格吸附会把盒高压掉 1~2px）
        if (parseFloat(getComputedStyle(el).fontSize) > el.clientHeight + 1) continue;
        // 横向判据：读 scrollWidth 会强制回流，拿到当前字号下的真实文字宽度
        if (el.scrollWidth - p <= avail + 0.5) return c;
      }
      return null;
    };

    const fit = () => {
      const basePad = getComputedStyle(el).paddingLeft;
      let chosen = tryWith(basePad); // ①
      if (chosen === null) chosen = tryWith("0px"); // ②
      if (chosen !== null) {
        el.style.fontSize = px(chosen);
        return;
      }
      // ③ 等比兜底
      const smallest = candidates[candidates.length - 1];
      el.style.fontSize = px(smallest);
      const p = measure();
      const avail = el.clientWidth - p;
      const need = el.scrollWidth - p;
      el.style.fontSize = `calc(${px(smallest)} * ${((avail / need) * 0.98).toFixed(4)})`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [key]);
  return ref;
}

/* ------------------------------------------------------------------ *
 * 画布
 * ------------------------------------------------------------------ */

/**
 * 图元额外透传的原生属性（`data-node-id`、其它 `data-*` / `aria-*`、`id`、事件…）。
 *
 * **约定**：这些属性一律落在图元 render 出来的**第一个 DOM 元素**上 ——
 * 外部工具（设计器 / 节点定位器）据此把页面上的 DOM 节点与设计节点对应起来。
 * 所以典型写法是 `<Text data-node-id="n-12" …/>`，属性最终出现在那个 `<div>` 上；
 * 对于 render 出多个根节点的图元（如 `ScreenHeader`），只放在第一个根节点上。
 *
 * 排除 5 个由各图元自己管理的键：
 *   className / style / children —— 图元内部本来就要拼装它们；
 *   onClick / onChange —— 与图元自身同名 prop 取交集会变成函数类型求交，
 *   把调用方 `(v: number) => void` 这类写法判成类型错误。
 *
 * 说明：TS 对"带连字符"的属性名不做检查，所以即使不声明这个类型，
 * `data-node-id` 也能传进来；这里显式声明是为了让 `id` / `aria-*` /
 * `role` 等普通属性同样可用，并把上面的约定写在类型上。
 */
export type Passthrough = Omit<
  React.HTMLAttributes<HTMLElement>,
  "className" | "style" | "children" | "onClick" | "onChange"
> & {
  /**
   * 插件注入的源码定位 id。**显式写进 props 类型**有两个原因：
   *  1. 组件需要把它单独取出来、显式声明在第一个 DOM 元素上（见下）；
   *  2. 只有声明了，`props["data-node-id"]` 在 TS 里才可读。
   */
  "data-node-id"?: string;
};

/** 铺满视口的等比画布 */
export function Stage({
  width,
  height,
  className,
  children,
  ...rest
}: {
  width: number;
  height: number;
  className?: string;
  children: React.ReactNode;
} & Passthrough) {
  const cols = Math.max(1, Math.round(width / GRID_STEP));
  const rows = Math.max(1, Math.round(height / GRID_STEP));
  return (
    <div
      className={cn(STAGE, className)}
      data-canvas={`${width}x${height}`}
      style={
        {
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          "--u": `min(${((100 / width) * 1).toFixed(6)}cqw, ${((100 / height) * 1).toFixed(6)}cqh)`,
          /**
           * --ut = "页面外框单位"：永远以 1280×800 为基准，**与当前画布尺寸无关**。
           * 标题条用它，因此不论页面画布是 1280×800 还是 1920×1080，
           * 标题的字号与底条高度在所有页面上渲染出来都完全相同。
           */
          "--ut": `min(${((100 / 1280) * 1).toFixed(6)}cqw, ${((100 / 800) * 1).toFixed(6)}cqh)`,
          // 标题尺寸：以 1280×800 为基准的设计稿 px（由 --ut 换算），单点持有
          "--title-size": String(SPEC.title),
          "--titlebar-h": String(SPEC.titleBarH),
        } as React.CSSProperties
      }
      {...rest}
    >
      <CanvasCtx.Provider value={{ w: width, h: height, cols, rows }}>
        {children}
      </CanvasCtx.Provider>
    </div>
  );
}

/** 兼容旧命名：等价于 Stage */
export const FitBox = Stage;

/**
 * 带子网格的容器：自身按父画布定位，并为内部子元素建立同尺寸的新画布。
 * Abs / Panel / DarkPanel 共用这套语义。
 */
function Cell({
  x,
  y,
  w,
  h,
  className,
  style,
  children,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Passthrough) {
  const parent = useCanvas();
  const cols = Math.max(1, Math.round(w / GRID_STEP));
  const rows = h === undefined ? undefined : Math.max(1, Math.round(h / GRID_STEP));

  return (
    <div
      className={cn(CELL, className)}
      data-box={`${x},${y},${w},${h ?? ""}`}
      style={{ ...place(parent, x, y, w, h), ...style }}
      {...rest}
    >
      {children === undefined ? null : (
        <div
          className={SUBGRID}
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows:
              rows === undefined ? undefined : `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          <CanvasCtx.Provider value={{ w, h: h ?? w, cols, rows: rows ?? cols }}>
            {children}
          </CanvasCtx.Provider>
        </div>
      )}
    </div>
  );
}

/** 定位盒子（内部子元素继续用相对父容器的坐标） */
export function Abs({
  x,
  y,
  w,
  h,
  className,
  style,
  children,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Passthrough) {
  return (
    <Cell x={x} y={y} w={w} h={h} className={className} style={style} {...rest}>
      {children}
    </Cell>
  );
}

/** 定位盒子 + 内部为常规流式布局（不建立子网格） */
export function Box({
  x,
  y,
  w,
  h,
  className,
  style,
  children,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "style" | "children">) {
  const ctx = useCanvas();
  return (
    <div
      className={cn(CELL, className)}
      data-box={`${x},${y},${w},${h ?? ""}`}
      style={{ ...place(ctx, x, y, w, h), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** 把「原画布 px」换算成当前视口尺寸的表达式 */
export function useCq(): (v: number) => string {
  useCanvas(); // 确保处于画布内（--u 由 Stage 提供）
  return px;
}

/* ------------------------------------------------------------------ *
 * 文本
 * ------------------------------------------------------------------ */

export function Text({
  x,
  y,
  w,
  h,
  size = 30,
  color = "#fff",
  weight = 700,
  align = "left",
  plate = false,
  font,
  className,
  children,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  size?: number;
  color?: string;
  weight?: number;
  align?: "left" | "center" | "right";
  plate?: boolean;
  font?: "kai" | "sans" | "led";
  className?: string;
  children?: React.ReactNode;
} & Passthrough) {
  const ctx = useCanvas();
  const map = { left: "flex-start", center: "center", right: "flex-end" } as const;
  const tier = tierText(size);
  const fontSize = px(tier);
  const text =
    typeof children === "string" || typeof children === "number" ? String(children) : "";
  const ref = useFitText<HTMLDivElement>(
    TEXT_TIERS.filter((t) => t <= tier),
    text,
  );

  // 标签层（带托板）统一走 hmi-label 的颜色与字重，与内容层区分；
  // 页面显式传了颜色时以页面为准。
  const finalColor = plate && color === "#fff" ? "#cfe8ff" : color;

  return (
    <div
      ref={ref}
      className={cn(
        `${CELL} flex items-center overflow-hidden whitespace-nowrap`,
        plate ? `${PLATE} ${LABEL}` : TEXT,
        className,
      )}
      data-box={`${x},${y},${w},${h ?? ""}`}
      data-text={plate ? "label" : "plain"}
      style={{
        ...place(ctx, x, y, w, h),
        justifyContent: map[align],
        fontSize,
        color: finalColor,
        fontWeight: plate ? 700 : weight,
        fontFamily:
          font === "led" || font === "sans" ? "var(--font-tech)" : "var(--font-ui)",
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 时钟
 * ------------------------------------------------------------------ */

export function Clock({
  x,
  y,
  w,
  h,
  size = 19,
  align = "center",
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  size?: number;
  align?: "left" | "center" | "right";
} & Passthrough) {
  const [now, setNow] = useState(() => format(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setNow(format(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Text x={x} y={y} w={w} h={h} size={size} weight={400} align={align} font="sans" {...rest}>
      {now}
    </Text>
  );
}

function format(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
}

/* ------------------------------------------------------------------ *
 * 数值显示（内容层：全站统一字号 --fs-num）
 * ------------------------------------------------------------------ */

export function Readout({
  x,
  y,
  w,
  h,
  value,
  color = "rgb(255, 93, 93)",
  digits = 1,
  led = false,
  align = "left",
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  value: number | string;
  /** 保留入参以兼容原页面；实际字号由 --fs-num 统一 */
  size?: number;
  color?: string;
  digits?: number;
  led?: boolean;
  align?: "left" | "center" | "right";
} & Passthrough) {
  const text = typeof value === "number" ? value.toFixed(digits) : value;
  const ctx = useCanvas();
  const map = { left: "flex-start", center: "center", right: "flex-end" } as const;
  const tier = SPEC.num;
  const fontSize = px(tier);
  const ref = useFitText<HTMLDivElement>(
    TEXT_TIERS.filter((t) => t <= tier),
    String(text),
  );

  return (
    <div
      ref={ref}
      className={cn(
        `${CELL} ${VALUE} flex items-center overflow-hidden whitespace-nowrap`,
        led && LED_GLOW,
      )}
      data-box={`${x},${y},${w},${h ?? ""}`}
      data-value
      style={{
        ...place(ctx, x, y, w, h),
        justifyContent: map[align],
        fontSize,
        color,
      }}
      {...rest}
    >
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 数字输入（全站统一控件高度 --ctl-h 与字号 --fs-input）
 * ------------------------------------------------------------------ */

export function NumberField({
  x,
  y,
  w,
  h,
  value,
  onChange,
  color = "rgb(248, 231, 28)",
  font = "kai",
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  value: number | string;
  onChange?: (v: number) => void;
  /** 保留入参以兼容原页面；实际字号由 SPEC.fsInput 统一 */
  size?: number;
  color?: string;
  font?: "kai" | "sans";
} & Passthrough) {
  const ctx = useCanvas();
  const [draft, setDraft] = useState<string>(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n)) onChange?.(n);
    else setDraft(String(value));
  };

  return (
    <div
      className={cn(CELL, "flex items-center")}
      data-box={`${x},${y},${w},${h}`}
      style={place(ctx, x, y, w, h)}
      {...rest}
    >
      <div data-ctl className={CTL}>
        <input
          className={INPUT}
          style={{
            color,
            fontFamily: font === "sans" ? "var(--font-tech)" : "var(--font-ui)",
          }}
          value={draft}
          inputMode="decimal"
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            commit();
          }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 步进器（减 / 输入 / 加）
 * ------------------------------------------------------------------ */

export function Stepper({
  x,
  y,
  w,
  h,
  value,
  onChange,
  step = 1,
  digits = 0,
  color = "rgb(248, 231, 28)",
  min = -Infinity,
  max = Infinity,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  value: number;
  onChange?: (v: number) => void;
  step?: number;
  digits?: number;
  /** 保留入参以兼容原页面 */
  size?: number;
  color?: string;
  min?: number;
  max?: number;
} & Passthrough) {
  const ctx = useCanvas();
  const clamp = (v: number) => Math.min(max, Math.max(min, Number(v.toFixed(4))));

  return (
    <div
      className={cn(CELL, "flex items-center")}
      data-box={`${x},${y},${w},${h}`}
      style={place(ctx, x, y, w, h)}
      {...rest}
    >
      <div
        className="flex w-full items-stretch"
        style={{ height: px(SPEC.ctl), gap: px(6) }}
      >
        <button
          type="button"
          aria-label="减少"
          className={STEP}
          style={{ width: "18%" }}
          onClick={() => onChange?.(clamp(value - step))}
        >
          <Minus aria-hidden style={{ width: "46%", height: "46%" }} />
        </button>
        <div data-ctl className={cn(CTL, "flex-auto")}>
          <input
            className={INPUT}
            aria-label="数值"
            style={{ color, fontFamily: "var(--font-ui)" }}
            value={value.toFixed(digits)}
            inputMode="decimal"
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange?.(clamp(n));
            }}
          />
        </div>
        <button
          type="button"
          aria-label="增加"
          className={STEP}
          style={{ width: "18%" }}
          onClick={() => onChange?.(clamp(value + step))}
        >
          <Plus aria-hidden style={{ width: "46%", height: "46%" }} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 箭头按钮（色标位 / 冷封位微调）
 * ------------------------------------------------------------------ */

export function ArrowButton({
  x,
  y,
  w,
  h,
  direction,
  onClick,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  direction: "up" | "down" | "doubleUp" | "doubleDown";
  onClick?: () => void;
} & Passthrough) {
  const ctx = useCanvas();
  const Icon =
    direction === "up"
      ? ChevronUp
      : direction === "down"
        ? ChevronDown
        : direction === "doubleUp"
          ? ChevronsUp
          : ChevronsDown;
  const label = {
    up: "增加 1",
    down: "减少 1",
    doubleUp: "增加 10",
    doubleDown: "减少 10",
  }[direction];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-arrow
      className={cn(CELL, ARROW)}
      data-box={`${x},${y},${w},${h}`}
      style={place(ctx, x, y, w, h)}
      {...rest}
    >
      <Icon aria-hidden style={{ width: "58%", height: "58%" }} />
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * 按钮（文字字号全站唯一：--fs-btn）
 * ------------------------------------------------------------------ */

export type HmiButtonVariant =
  | "blue"
  | "blueTop"
  | "blueRev"
  | "blueSingle"
  | "nav"
  | "red"
  | "yellow"
  | "light"
  | "green"
  | "purple";

export function HmiButton({
  x,
  y,
  w,
  h,
  variant = "blue",
  big,
  color,
  onClick,
  children,
  className,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  variant?: HmiButtonVariant;
  /** 大磁贴（主菜单专用）：字号走 SPEC.tile，比普通按钮大一档 */
  big?: boolean;
  /** 保留入参以兼容原页面：按钮字号由 SPEC.btn / SPEC.tile 决定 */
  size?: number;
  color?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
} & Passthrough) {
  const ctx = useCanvas();
  const variantClass = `${BTN} ${BTN_VARIANT[variant]}`;

  const tier = big ? SPEC.tile : SPEC.btn;
  const text =
    typeof children === "string" || typeof children === "number" ? String(children) : "";
  // 按钮字号不在文字阶梯里（28 格外），显式给出候选档位，保证同档按钮完全一致
  const ref = useFitText<HTMLButtonElement>(
    [tier, ...TEXT_TIERS.filter((t) => t < tier)],
    text,
  );

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      data-btn
      className={cn(variantClass, BTN_PAD, CELL, className)}
      data-box={`${x},${y},${w},${h}`}
      data-btn-tier={tier}
      style={{ ...place(ctx, x, y, w, h), color }}
      {...rest}
    >
      <span className="pointer-events-none leading-none">{children}</span>
    </button>
  );
}

/** 开 / 关 状态切换按钮（灰底黑字，点击切换） */
export function StatusButton({
  x,
  y,
  w,
  h,
  on,
  onLabel = "已开启",
  offLabel = "已关闭",
  variant = "light",
  onVariant = "green",
  onClick,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  onLabel?: string;
  offLabel?: string;
  variant?: HmiButtonVariant;
  onVariant?: HmiButtonVariant;
  /** 保留入参以兼容原页面 */
  size?: number;
  onClick?: () => void;
} & Passthrough) {
  return (
    <HmiButton
      x={x}
      y={y}
      w={w}
      h={h}
      variant={on ? onVariant : variant}
      color={on ? "#000" : undefined}
      onClick={onClick}
      {...rest}
    >
      {on ? onLabel : offLabel}
    </HmiButton>
  );
}

/* ------------------------------------------------------------------ *
 * 面板容器
 * ------------------------------------------------------------------ */

export function Panel({
  x,
  y,
  w,
  h,
  className,
  children,
  strong,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  className?: string;
  children?: React.ReactNode;
  strong?: boolean;
} & Passthrough) {
  return (
    <Cell
      x={x}
      y={y}
      w={w}
      h={h}
      className={cn(BAR, strong && BAR_STRONG, className)}
      {...rest}
    >
      {children}
    </Cell>
  );
}

/** 半透明黑底容器 */
export function DarkPanel({
  x,
  y,
  w,
  h,
  className,
  children,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  className?: string;
  children?: React.ReactNode;
} & Passthrough) {
  return (
    <Cell x={x} y={y} w={w} h={h} className={cn(DARKBAR, className)} {...rest}>
      {children}
    </Cell>
  );
}

/* ------------------------------------------------------------------ *
 * 顶栏（两行：工单信息 / 标题 + 时钟）
 * 标题字号全站统一 --fs-title；工单字段统一 --fs-sm 并弱化处理。
 * ------------------------------------------------------------------ */

export function ScreenHeader({
  title,
  width,
  leftSlot,
  row2Height = 56,
  showNumber = true,
  ...rest
}: {
  title: string;
  /** 保留入参以兼容原页面；标题字号已全站统一为 CSS 令牌 --title-size */
  titleSize?: number;
  width: number;
  leftSlot?: React.ReactNode;
  row2Height?: number;
  /** 保留入参以兼容原页面；时钟位置与字号已全站统一 */
  clockWidth?: number;
  showNumber?: boolean;
} & Passthrough) {
  const row1W = width;
  const meta = META_KEY;
  return (
    <>
      {/* 本图元 render 出多个根节点，data-node-id 等透传属性只落在第一个上 */}
      <Panel x={0} y={0} w={row1W} h={row2Height} {...rest} />
      <Text x={0} y={0} w={77} h={row2Height} size={25} className={meta}>
        机台：
      </Text>
      <Text x={77} y={0} w={90} h={row2Height} size={25}>
        JB301
      </Text>
      <Text x={166} y={0} w={77} h={row2Height} size={25} className={meta}>
        品名：
      </Text>
      <Text x={243} y={0} w={384} h={row2Height} size={25}>
        经典红烧牛肉桶面酱包
      </Text>
      <Text x={627} y={0} w={77} h={row2Height} size={25} className={meta}>
        品号：
      </Text>
      <Text x={704} y={0} w={192} h={row2Height} size={25}>
        1502AT11B
      </Text>
      <Text x={896} y={0} w={102} h={row2Height} size={25} className={meta}>
        工单号：
      </Text>
      <Text x={998} y={0} w={256} h={row2Height} size={25}>
        110922521
      </Text>

      <Panel x={0} y={61} w={row1W} h={row2Height} />
      {showNumber ? (
        <Text x={0} y={61} w={90} h={row2Height} size={25} className={meta}>
          编号：
        </Text>
      ) : null}
      {leftSlot}
      {/* 标题行：底条与字号走 --ut（与画布无关），标题在整幅画面上真正居中 */}
      <Box
        x={0}
        y={61}
        w={row1W}
        data-titlebar
        className={cn(TITLEBAR, "grid items-center")}
        style={{
          height: "calc(var(--ut) * var(--titlebar-h))",
          gridTemplateColumns: "1fr auto 1fr",
          paddingInline: "calc(var(--ut) * 24)",
        }}
      >
        <span aria-hidden />
        <span
          data-page-title
          className={PAGE_TITLE}
          style={{ fontSize: "calc(var(--ut) * var(--title-size))" }}
        >
          {title}
        </span>
        <HeaderClock className="justify-self-end" />
      </Box>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 页面标题条（全站统一）
 *
 * 所有页面共用同一套标题样式：同样的底条高度、同样的字号、
 * 同样的居中方式、同样的字重/颜色/发光（.hmi-page-title），右上角同一位置放时钟。
 * 两行式顶栏（ScreenHeader）的标题行也套用同一规范，
 * 因此各页标题除了"多一行工单信息"之外完全一致。
 * ------------------------------------------------------------------ */

/** 标题条内的时钟（视口相对字号，保证各页一致） */
function HeaderClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => format(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setNow(format(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span
      className={cn("whitespace-nowrap font-tech tabular-nums text-hmi-cyan", className)}
      style={{ fontSize: "calc(var(--ut) * 25)" }}
    >
      {now}
    </span>
  );
}

export function PageHeader({
  title,
  width,
  clock = true,
  titleSize,
  barHeight,
  ...rest
}: {
  title: string;
  width: number;
  /** 是否显示右上角时钟（默认显示） */
  clock?: boolean;
  /**
   * 标题字号 / 底条高度（以 1280×800 为基准的设计稿 px）。
   * 不传则用全站统一值（SPEC.title / SPEC.titleBarH）。
   * 仅个别画布更大、元素更大的页面（如主菜单）需要单独放大。
   *
   * 实现上只是把 --title-size / --titlebar-h 这两个**数据**覆盖在标题条上，
   * Tailwind 类名完全不变，因此不会引入任何额外样式分支。
   */
  titleSize?: number;
  barHeight?: number;
} & Passthrough) {
  return (
    <Box
      x={0}
      y={0}
      w={width}
      data-titlebar
      {...rest}
      className={cn(TITLEBAR, "grid items-center")}
      style={{
        height: "calc(var(--ut) * var(--titlebar-h))",
        gridTemplateColumns: "1fr auto 1fr",
        paddingInline: "calc(var(--ut) * 24)",
        ...(titleSize !== undefined && { "--title-size": String(titleSize) }),
        ...(barHeight !== undefined && { "--titlebar-h": String(barHeight) }),
      } as React.CSSProperties}
    >
      {/* 左侧占位与右侧时钟等宽，保证标题落在画面正中央 */}
      <span aria-hidden />
      <span
        data-page-title
        className={PAGE_TITLE}
        style={{ fontSize: "calc(var(--ut) * var(--title-size))" }}
      >
        {title}
      </span>
      {clock ? <HeaderClock className="justify-self-end" /> : <span aria-hidden />}
    </Box>
  );
}

/* ------------------------------------------------------------------ *
 * 弹窗按钮（供 VerifyPasswordDialog 使用）
 * ------------------------------------------------------------------ */

export function TouchButton({
  variant = "default",
  block,
  icon,
  onClick,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: {
  variant?: "nav" | "primary" | "danger" | "warn" | "ok" | "ghost" | "light" | "default";
  block?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit";
} & Passthrough) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        BTN,
        DLG_BTN,
        BTN_VARIANT[variant] ?? "",
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
