import { useId, type SVGAttributes } from "react";

/* ------------------------------------------------------------------ *
 * 温度设定页中央的封口机构示意图（还原参考系统里的机械插画）
 *
 * 实现要点（v2）：
 *  1. 尺寸完全由父容器驱动：width/height = 100% + viewBox + preserveAspectRatio，
 *     不再接收固定像素宽高。父容器通常是 <Abs x y w h>（它会为子元素建立
 *     等比子网格），所以这里额外用 grid-area 让 svg 铺满整个子网格，
 *     否则 svg 作为唯一的自动放置项只会占住第一个网格单元。
 *  2. 配色改用新技术风令牌（--color-hmi-*），玻璃质感描边 + 青色辉光；
 *  3. 渐变 / 滤镜 id 用 useId() 生成唯一前缀，避免同页多处渲染时 id 冲突。
 * ------------------------------------------------------------------ */

/**
 * 透传属性放在 render 出的第一个 DOM 元素（这里的 `<svg>`）上，
 * 与其余图元一致（见 primitives.tsx 的 Passthrough 约定）。
 */
export function SealUnitGraphic({
  className,
  ...rest
}: { className?: string } & Omit<SVGAttributes<SVGSVGElement>, "className" | "children">) {
  // useId 自带分隔符（不同 React 版本格式不同），统一剔除非字母数字字符，
  // 保证生成的 id 在任何浏览器里都能被 url(#…) 正确引用。
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const steel = `${uid}-steel`;
  const steelDark = `${uid}-steel-dark`;
  const brass = `${uid}-brass`;
  const shaft = `${uid}-shaft`;
  const glow = `${uid}-glow`;

  /** 统一描边：玻璃质感冷色描边 */
  const edge = "var(--color-hmi-line-strong)";

  return (
    <svg
      viewBox="0 0 507 422"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="封口机构示意图"
      className={className}
      style={{ gridArea: "1 / 1 / -1 / -1" }}
      {...rest}
    >
      <defs>
        {/* 不锈钢压条：玻璃蓝渐变 */}
        <linearGradient id={steel} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-hmi-cyan)", stopOpacity: 0.62 }} />
          <stop offset="35%" style={{ stopColor: "var(--color-hmi-blue)", stopOpacity: 0.68 }} />
          <stop offset="72%" style={{ stopColor: "var(--color-hmi-blue-deep)", stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-hmi-bg-3)", stopOpacity: 1 }} />
        </linearGradient>

        {/* 端部卡座：更深的蓝 */}
        <linearGradient id={steelDark} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-hmi-blue)", stopOpacity: 0.95 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-hmi-bg-2)", stopOpacity: 1 }} />
        </linearGradient>

        {/* 铜色衬块：暖色令牌（warn → set） */}
        <linearGradient id={brass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-hmi-set)", stopOpacity: 0.95 }} />
          <stop offset="55%" style={{ stopColor: "var(--color-hmi-warn)", stopOpacity: 0.95 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-hmi-warn)", stopOpacity: 0.55 }} />
        </linearGradient>

        {/* 传动轴：青色高光 */}
        <linearGradient id={shaft} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: "var(--color-hmi-blue)", stopOpacity: 0.7 }} />
          <stop offset="50%" style={{ stopColor: "var(--color-hmi-cyan)", stopOpacity: 0.95 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-hmi-unit)", stopOpacity: 0.8 }} />
        </linearGradient>

        {/* 青色辉光 */}
        <filter id={glow} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.2" result="blurred" />
          <feMerge>
            <feMergeNode in="blurred" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(96 60) rotate(-8)" filter={`url(#${glow})`}>
        {/* 上：纵封内侧 / 横封内侧 一组 */}
        <g>
          <rect
            x="0"
            y="0"
            width="330"
            height="52"
            rx="26"
            fill={`url(#${steel})`}
            stroke={edge}
            strokeWidth="1.2"
          />
          <rect
            x="0"
            y="0"
            width="330"
            height="16"
            rx="8"
            style={{ fill: "var(--color-hmi-cyan)", opacity: 0.4 }}
          />
          <rect
            x="292"
            y="6"
            width="46"
            height="40"
            rx="10"
            fill={`url(#${steelDark})`}
            stroke={edge}
            strokeWidth="1.2"
          />
        </g>
        <g transform="translate(8 74)">
          <rect
            x="0"
            y="0"
            width="316"
            height="52"
            rx="26"
            fill={`url(#${steel})`}
            stroke={edge}
            strokeWidth="1.2"
          />
          <rect
            x="0"
            y="0"
            width="316"
            height="16"
            rx="8"
            style={{ fill: "var(--color-hmi-cyan)", opacity: 0.4 }}
          />
          <rect
            x="278"
            y="6"
            width="46"
            height="40"
            rx="10"
            fill={`url(#${steelDark})`}
            stroke={edge}
            strokeWidth="1.2"
          />
        </g>

        {/* 铜色衬块 */}
        <g>
          <rect
            x="330"
            y="0"
            width="64"
            height="52"
            rx="8"
            fill={`url(#${brass})`}
            stroke={edge}
            strokeWidth="1.2"
          />
          <rect
            x="316"
            y="74"
            width="64"
            height="52"
            rx="8"
            fill={`url(#${brass})`}
            stroke={edge}
            strokeWidth="1.2"
          />
        </g>

        {/* 轴 */}
        <g>
          <rect
            x="-58"
            y="18"
            width="60"
            height="16"
            rx="8"
            fill={`url(#${shaft})`}
            stroke={edge}
            strokeWidth="1"
          />
          <rect
            x="-58"
            y="92"
            width="60"
            height="16"
            rx="8"
            fill={`url(#${shaft})`}
            stroke={edge}
            strokeWidth="1"
          />
        </g>

        {/* 下：纵封外侧 / 横封外侧 一组 */}
        <g transform="translate(4 166)">
          <rect
            x="0"
            y="0"
            width="330"
            height="52"
            rx="26"
            fill={`url(#${steel})`}
            stroke={edge}
            strokeWidth="1.2"
          />
          <rect
            x="0"
            y="0"
            width="330"
            height="16"
            rx="8"
            style={{ fill: "var(--color-hmi-cyan)", opacity: 0.4 }}
          />
          <rect
            x="292"
            y="6"
            width="46"
            height="40"
            rx="10"
            fill={`url(#${steelDark})`}
            stroke={edge}
            strokeWidth="1.2"
          />
        </g>
        <g transform="translate(12 240)">
          <rect
            x="0"
            y="0"
            width="316"
            height="52"
            rx="26"
            fill={`url(#${steel})`}
            stroke={edge}
            strokeWidth="1.2"
          />
          <rect
            x="0"
            y="0"
            width="316"
            height="16"
            rx="8"
            style={{ fill: "var(--color-hmi-cyan)", opacity: 0.4 }}
          />
          <rect
            x="278"
            y="6"
            width="46"
            height="40"
            rx="10"
            fill={`url(#${steelDark})`}
            stroke={edge}
            strokeWidth="1.2"
          />
        </g>
        <g transform="translate(4 166)">
          <rect
            x="330"
            y="0"
            width="64"
            height="52"
            rx="8"
            fill={`url(#${brass})`}
            stroke={edge}
            strokeWidth="1.2"
          />
        </g>
        <g transform="translate(12 240)">
          <rect
            x="316"
            y="0"
            width="64"
            height="52"
            rx="8"
            fill={`url(#${brass})`}
            stroke={edge}
            strokeWidth="1.2"
          />
        </g>
        <g>
          <rect
            x="-58"
            y="184"
            width="62"
            height="16"
            rx="8"
            fill={`url(#${shaft})`}
            stroke={edge}
            strokeWidth="1"
          />
          <rect
            x="-58"
            y="258"
            width="62"
            height="16"
            rx="8"
            fill={`url(#${shaft})`}
            stroke={edge}
            strokeWidth="1"
          />
        </g>
      </g>
    </svg>
  );
}
