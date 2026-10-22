/* ==================================================================
 * 全站样式的唯一来源 —— 纯 Tailwind className
 *
 * 本项目**没有手写 CSS**：index.css 只有 Tailwind 入口与 @theme 令牌，
 * 所有视觉一律由这里的 Tailwind 工具类表达。
 *
 * 注意：类名必须是**完整字面量**（不能拼接字符串），否则 Tailwind 扫描不到、
 * 不会生成对应的 CSS。凡是依赖画布缩放单位 --u 的值，写成
 * `[calc(var(--u)*N)]` 形式的完整字面量。
 * ================================================================== */

/* ------------------------------------------------------------------ *
 * 画布
 * ------------------------------------------------------------------ */

/** 铺满视口的等比画布：网格容器 + 容器查询 + 科技底纹 */
export const STAGE = [
  "relative grid h-dvh w-full overflow-hidden",
  "[container-type:size]",
  "bg-hmi-bg",
  "[background-image:radial-gradient(1100px_540px_at_6%_-14%,rgba(56,232,255,0.13),transparent_62%),radial-gradient(900px_500px_at_104%_-8%,rgba(123,108,255,0.13),transparent_58%),radial-gradient(1100px_720px_at_50%_120%,rgba(28,92,200,0.2),transparent_62%),repeating-linear-gradient(to_right,rgba(88,152,240,0.055)_0_1px,transparent_1px_56px),repeating-linear-gradient(to_bottom,rgba(88,152,240,0.055)_0_1px,transparent_1px_56px),linear-gradient(158deg,#04101f_0%,#061428_46%,#03080f_100%)]",
].join(" ");

/** 画布单元：定位与裁切的基底（不是绝对定位，落位靠网格线号） */
export const CELL = "relative min-h-0 min-w-0 overflow-hidden";

/**
 * 子网格：让嵌套元素继续用「相对父容器」的 x/y/w/h。
 * 没有 data-box 的直接子元素（裸 div / svg / 原生控件）铺满父容器 ——
 * 否则会被自动放进第一个网格单元而塌缩成 2px 见方。
 */
export const SUBGRID =
  "grid h-full w-full [&>:not([data-box])]:[grid-area:1/1/-1/-1]";

/* ------------------------------------------------------------------ *
 * 文字层级
 * ------------------------------------------------------------------ */

/** 普通文字框：左右留内边距，不贴边 */
export const TEXT = "px-[calc(var(--u)*8)]";

/** 标签层（带托板）：比内容更重、偏青，用于区分"标题/标签"与"内容" */
export const LABEL =
  "px-[calc(var(--u)*12)] font-bold tracking-[0.03em] text-[#cfe8ff]";

/** 内容层（数值）：等宽数字 + 同色辉光 */
export const VALUE =
  "px-[calc(var(--u)*8)] font-tech font-bold tracking-[0.02em] tabular-nums [text-shadow:0_0_14px_currentColor]";

/** 页面标题 */
export const PAGE_TITLE =
  "font-bold tracking-[0.06em] text-[#f2f8ff] [text-shadow:0_0_28px_rgba(56,232,255,0.5)]";

/** 顶栏字段名（次要信息，弱化） */
export const META_KEY = "font-medium text-hmi-unit";

/* ------------------------------------------------------------------ *
 * 容器
 * ------------------------------------------------------------------ */

/** 标题条：通栏、不要圆角、只留底部分隔线 */
export const TITLEBAR = [
  "bg-gradient-to-b from-[rgba(18,46,86,0.78)] to-[rgba(8,22,44,0.66)]",
  "border-b border-hmi-line",
  "backdrop-blur-[10px] backdrop-saturate-[1.2]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
].join(" ");

/** 玻璃面板背景 */
export const BAR = [
  "rounded-md border border-hmi-line",
  "bg-gradient-to-b from-[rgba(18,46,86,0.52)] to-[rgba(8,22,44,0.62)]",
  "backdrop-blur-[10px] backdrop-saturate-[1.2]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
].join(" ");

/** 更强的面板底色（覆盖 BAR 的 from/to） */
export const BAR_STRONG = "from-[rgba(12,36,70,0.88)] to-[rgba(6,18,36,0.9)]";

/** 半透明黑底容器 */
export const DARKBAR = "rounded-md border border-hmi-line bg-[rgba(4,16,31,0.66)]";

/** 标签托板 */
export const PLATE = [
  "rounded-md border border-[rgba(120,190,255,0.34)]",
  "bg-gradient-to-b from-[rgba(56,120,210,0.5)] to-[rgba(18,56,122,0.62)]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
].join(" ");

/* ------------------------------------------------------------------ *
 * 按钮
 * ------------------------------------------------------------------ */

/** 按钮基底（不含渐变，渐变由变体给出，避免 from/to 冲突） */
export const BTN = [
  "[--btn-glow:rgba(77,141,255,0.45)]",
  "relative flex cursor-pointer select-none items-center justify-center gap-[0.35em] overflow-hidden",
  "rounded-md border border-[rgba(96,166,255,0.42)]",
  "text-[calc(var(--u)*28)] font-ui font-bold tracking-[0.05em] text-center text-[#eaf4ff]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_6px_18px_-10px_rgba(0,0,0,0.9)]",
  "transition-[filter,box-shadow,border-color] duration-[180ms]",
  "hover:border-hmi-cyan hover:brightness-[1.14]",
  "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_22px_-6px_var(--btn-glow)]",
  "active:brightness-90",
].join(" ");

/**
 * 按钮左右内边距（仅画布内按钮使用）。
 * 单独成一个常量而不是写进 BTN，是为了避免与弹窗按钮 DLG_BTN 的 px-[1.2em]
 * 产生"两个 padding 工具类争用"的问题。
 * 数值与标签托板 / 输入框的内缩同源（都是 12 设计稿 px）。
 */
export const BTN_PAD = "px-[calc(var(--u)*12)]";

/** 按钮变体（只负责配色与光晕基色） */
export const BTN_VARIANT: Record<string, string> = {
  blue: "bg-gradient-to-b from-[rgba(48,106,194,0.95)] to-[rgba(18,48,104,0.95)]",
  blueTop: "bg-gradient-to-t from-[rgb(71,82,110)] to-[rgb(13,56,167)]",
  blueRev: "bg-gradient-to-t from-[rgb(71,82,110)] to-[rgb(13,56,167)]",
  blueSingle: "bg-gradient-to-t from-[rgb(74,144,226)] to-[rgb(126,186,255)]",
  nav: "[--btn-glow:rgba(56,232,255,0.55)] bg-gradient-to-t from-[rgb(124,194,255)] to-[rgb(28,92,200)]",
  red: "[--btn-glow:rgba(255,93,93,0.6)] bg-gradient-to-t from-[rgb(208,2,27)] to-[rgb(255,98,98)]",
  yellow:
    "[--btn-glow:rgba(255,208,63,0.6)] bg-gradient-to-t from-[rgb(255,222,123)] to-[rgb(255,197,48)] text-black",
  green:
    "[--btn-glow:rgba(61,220,151,0.6)] bg-gradient-to-t from-[rgb(107,255,181)] to-[rgb(222,255,238)]",
  light:
    "[--btn-glow:rgba(226,235,250,0.45)] border-[rgba(255,255,255,0.6)] bg-none bg-[rgb(226,229,236)] text-[#0a1a30]",
  primary:
    "[--btn-glow:rgba(56,232,255,0.6)] border-[rgba(150,240,255,0.55)] bg-gradient-to-b from-[rgba(56,232,255,0.96)] to-[rgba(28,108,224,0.96)] text-[#02121f]",
  danger:
    "[--btn-glow:rgba(255,93,93,0.6)] bg-gradient-to-b from-[rgba(255,98,98,0.96)] to-[rgba(176,16,32,0.96)]",
  warn:
    "[--btn-glow:rgba(255,208,63,0.6)] bg-gradient-to-b from-[rgba(255,222,123,0.96)] to-[rgba(228,164,22,0.96)] text-[#241a00]",
  ok: "[--btn-glow:rgba(61,220,151,0.6)] bg-gradient-to-b from-[rgba(107,255,181,0.96)] to-[rgba(24,168,112,0.96)] text-[#02170f]",
  /** MES「确认排程」的紫色：与原内联 linear-gradient(0deg, 亮紫, 暗紫) 上下方向逐字对应 */
  purple: "bg-gradient-to-t from-[rgb(184,133,202)] to-[rgba(120,70,150,1)] text-white",
  ghost: "[--btn-glow:rgba(56,232,255,0.35)] border-hmi-line bg-none bg-[rgba(88,152,240,0.1)] text-[#cfe2fb]",
};

/** 弹窗按钮：独立的触摸高度与左右内边距 */
export const DLG_BTN = "min-h-[clamp(2.75rem,5vh,3.5rem)] px-[1.2em]";

/** 方块按钮（弹窗图标 / 步进器两侧） */
export const ARROW = [
  "flex items-center justify-center rounded-md border border-[rgba(96,166,255,0.42)]",
  "bg-gradient-to-b from-[rgba(48,106,194,0.9)] to-[rgba(18,48,104,0.9)]",
  "text-[#eaf4ff] cursor-pointer select-none",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
  "transition-[filter,border-color,box-shadow] duration-[180ms]",
  "hover:border-[rgba(56,232,255,0.7)] hover:brightness-[1.16]",
  "hover:shadow-[0_0_20px_-6px_rgba(56,232,255,0.65)]",
  "active:brightness-[0.92]",
].join(" ");

/** 步进器两侧的加减按钮 */
export const STEP = [
  "flex flex-none cursor-pointer items-center justify-center rounded-md border border-hmi-line",
  "bg-gradient-to-b from-[rgba(48,106,194,0.85)] to-[rgba(18,48,104,0.85)]",
  "text-[#eaf4ff] transition-[filter,border-color] duration-150",
  "hover:border-[rgba(56,232,255,0.7)] hover:brightness-[1.18] active:brightness-90",
].join(" ");

/* ------------------------------------------------------------------ *
 * 输入
 * ------------------------------------------------------------------ */

/** 输入控件外框：全站唯一高度 56 与内边距 12（以设计稿 px 计） */
export const CTL = [
  "flex w-full min-w-0 items-center",
  "h-[calc(var(--u)*56)] px-[calc(var(--u)*12)]",
  "rounded-md border border-hmi-line bg-[rgba(4,16,31,0.55)]",
  "transition-[border-color,box-shadow] duration-[180ms]",
  "focus-within:border-hmi-cyan focus-within:shadow-[0_0_18px_-6px_var(--color-hmi-cyan)]",
].join(" ");

/** 画布内数字输入：等宽、居中、无边框 */
export const INPUT = [
  "w-full min-w-0 border-0 bg-transparent px-[0.2em] text-center outline-none",
  "font-tech text-[calc(var(--u)*34)] font-bold tabular-nums caret-hmi-cyan",
  "placeholder:text-[rgba(143,166,196,0.6)]",
].join(" ");

/** 弹窗/表单里的文本输入：非等宽、左对齐、常规字重 */
export const INPUT_PLAIN = "font-ui font-medium text-[#eaf4ff]";

/* ------------------------------------------------------------------ *
 * 弹窗（VerifyPasswordDialog）
 * ------------------------------------------------------------------ */

export const DLG_PANEL = [
  "relative flex min-w-0 flex-col gap-2 rounded-card border border-[rgba(56,232,255,0.45)] p-5",
  "bg-gradient-to-b from-[rgba(12,36,70,0.9)] to-[rgba(6,18,36,0.94)]",
  "backdrop-blur-[12px] backdrop-saturate-[1.2]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_0_26px_-8px_rgba(56,232,255,0.5),0_18px_40px_-28px_rgba(0,0,0,0.95)]",
].join(" ");

/** 科技角标：四角 L 形短线 */
export const BRACKET = [
  "after:pointer-events-none after:absolute after:inset-[6px]",
  "after:rounded-[8px]",
  "after:[--c:rgba(56,232,255,0.5)]",
  "after:[background:linear-gradient(var(--c),var(--c))_0_0/16px_2px_no-repeat,linear-gradient(var(--c),var(--c))_0_0/2px_16px_no-repeat,linear-gradient(var(--c),var(--c))_100%_0/16px_2px_no-repeat,linear-gradient(var(--c),var(--c))_100%_0/2px_16px_no-repeat,linear-gradient(var(--c),var(--c))_0_100%/16px_2px_no-repeat,linear-gradient(var(--c),var(--c))_0_100%/2px_16px_no-repeat,linear-gradient(var(--c),var(--c))_100%_100%/16px_2px_no-repeat,linear-gradient(var(--c),var(--c))_100%_100%/2px_16px_no-repeat]",
].join(" ");

export const DLG_HEAD =
  "flex flex-wrap items-center justify-between gap-2";

export const DLG_TITLE = [
  "flex items-center gap-[0.5em] text-lg font-bold tracking-[0.05em] text-[#dceaff]",
  "before:h-[0.5em] before:w-[0.5em] before:flex-none before:rotate-45 before:bg-hmi-cyan",
  "before:shadow-[0_0_10px_var(--color-hmi-cyan)] before:content-['']",
].join(" ");

export const DLG_FIELD = [
  "flex min-w-0 items-center gap-2 rounded-ctl border border-hmi-line bg-[rgba(4,16,31,0.55)] px-[0.65em]",
  "min-h-[calc(clamp(2.75rem,5vh,3.5rem)+2px)]",
  "transition-[border-color,box-shadow] duration-[180ms]",
  "focus-within:border-[rgba(56,232,255,0.7)] focus-within:shadow-[0_0_20px_-6px_rgba(56,232,255,0.6)]",
].join(" ");

export const DLG_FIELD_INPUT = "self-stretch text-left text-sm";

export const CHIP = [
  "inline-flex items-center gap-[0.4em] whitespace-nowrap rounded-full border border-hmi-line",
  "bg-[rgba(88,152,240,0.1)] px-[0.75em] py-[0.28em]",
  "text-sm font-medium tracking-[0.04em] text-[#cfdff5]",
].join(" ");

export const ROW_LABEL = "text-[15px] font-medium tracking-[0.03em] text-[#c3d6ef]";

export const STAT_LABEL = "text-sm tracking-[0.05em] text-[#9fb6d4]";

/* ------------------------------------------------------------------ *
 * 指示灯与色调
 * ------------------------------------------------------------------ */

export const LED = "relative inline-block size-[0.62em] flex-none rounded-full bg-hmi-off";

export const LED_ON =
  "bg-hmi-ok shadow-[0_0_10px_var(--color-hmi-ok)] motion-safe:animate-[hmi-pulse_2.2s_ease-in-out_infinite]";

export const LED_LIVE = "bg-hmi-live shadow-[0_0_10px_var(--color-hmi-live)]";

/** 数值辉光（LED 风格） */
export const LED_GLOW = "[text-shadow:0_0_18px_currentColor]";

/** 色调：live 实时值 / set 设定值 / unit 单位 / ok / warn / cyan / plain / off */
export const TONE: Record<string, string> = {
  live: "text-hmi-live",
  set: "text-hmi-set",
  unit: "text-hmi-unit",
  ok: "text-hmi-ok",
  warn: "text-hmi-warn",
  cyan: "text-hmi-cyan",
  plain: "text-[#eaf4ff]",
  off: "text-hmi-off",
};
