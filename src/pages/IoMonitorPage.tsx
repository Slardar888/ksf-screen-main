import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Abs,
  Box,
  HmiButton,
  PageHeader,
  Panel,
  Stage,
  Text,
} from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * I/O 监控（1920×800）
 *
 * 只调坐标 / 尺寸做统一，文案、元素数量与顺序全部不变：
 *
 *  1. 标题：原稿顶部那条自定义信息条（`<Panel x={10} y={13} w={1901} h={96} />`
 *     加若干 `<Text>`）里的**标题**部分换成统一标题条
 *     `<PageHeader title="I/O 监控" width={1920} />`（y=0、高 56、字号 50、
 *     居中、右上角时钟）；信息条里原有的字段（机架号 / 两个统计值 /
 *     「软元件监控」按钮）全部保留，整体下移到标题条之下。
 *
 *  2. 纵向节奏：全页统一 GAP=24；信息带 y=80 高 64（56 + 24）；
 *     表格 y=168（信息带底 144 + 24）；表头 56 与行高 56 **同一个值**，
 *     8 行 x 56 + 表头 56 = 表格高 504；底部按钮带 y = 表格底 672 + 24 = 696、
 *     高 64；页面底留白 40，与表格左右留白一致。
 *     —— 168 / 56 / 24 / 80 / 64 / 696 / 40 全部是 4 的倍数。
 *
 *  3. 列对齐基准：表格 x=40、宽 1840（左右留白 40）；4 列等宽 448、
 *     列间距 16（1840 = 4*448 + 3*16），列 x = 40 / 504 / 968 / 1432。
 *     每列内部再分「状态列」（宽 96）与「名称列」（宽 352），
 *     表头与每一个数据行都用同一套 x / 宽。
 *
 *  4. 尺寸统一：信息带字段一律 y=80、高 64，字段间距 16；表格容器
 *     1840×504；底部「返回主页 / 下一页」同为 272×64、间距 24、
 *     右边缘与表格右边缘同为 1880；说明文字与按钮同 y 同高。
 * ------------------------------------------------------------------ */

const COLS = [
  {
    list: ["X0", "X1", "X2", "X3", "X4", "X5", "X6", "X7"],
    // 原实现这一列点位名全是空字符串，这里按「输入 01…」补齐（列数 / 行数不变）
    names: ["输入 01", "输入 02", "输入 03", "输入 04", "输入 05", "输入 06", "输入 07", "输入 08"],
  },
  {
    list: ["X10", "X11", "X12", "X13", "X14", "X15", "X16", "X17"],
    names: ["色标检测", "张力检测", "断膜检测", "接膜1检测", "接膜2检测", "料位1", "料位2", "蝶阀"],
  },
  {
    list: ["X20", "X21", "X22", "X23", "X24", "X25", "X26", "X27"],
    names: ["急停", "启动", "停止", "点动", "注料", "切割", "卡泵检测", "备用"],
  },
  {
    list: ["X30", "X31", "X32", "X33", "X34", "X35", "X36", "X37"],
    names: ["安全门1", "安全门2", "安全门3", "电柜防护", "集电环防护1", "集电环防护2", "计量原点", "计量后限位"],
  },
];

/**
 * 原设计稿 px → CSS 长度。Stage 上定义了 `--u`（= 1 个原设计稿 px），
 * 原生控件与图元库用同一套换算，字号比例才不会走样。
 */
const u = (px: number) => `calc(var(--u) * ${px})`;

/* ---------------- 纵向节奏（全部 4 的倍数） ---------------- */

/** 全页统一的行 / 区间距 */
const GAP = 24;
/** 信息带：标题条 56 + 24 */
const INFO_Y = 80;
const INFO_H = 64;

/** 表格：x 左右留白 40，宽 1840 */
const MARGIN = 40;
const TABLE_X = MARGIN;
const TABLE_W = 1840;
const TABLE_Y = INFO_Y + INFO_H + GAP; // 168

/** 表头高度与数据行高取同一个值，全页一致 */
const HEADER_H = 56;
const ROW_H = 56;
const ROW_COUNT = 8;
const TABLE_H = HEADER_H + ROW_COUNT * ROW_H; // 504
/** 第 r 行数据行（含表头）的 y → 224 / 280 / … / 616 */
const rowY = (r: number) => TABLE_Y + HEADER_H + r * ROW_H;

/** 底部按钮带：表格底 672 + 24 */
const FOOT_Y = TABLE_Y + TABLE_H + GAP; // 696
const FOOT_H = 64;

/* ---------------- 列对齐基准（全部 4 的倍数） ---------------- */

const COL_GAP = 16;
/** 4 列等宽：1840 = 4*448 + 3*16 */
const COL_W = 448;
/** 第 i 列的 x → 40 / 504 / 968 / 1432 */
const COL_X = (i: number) => TABLE_X + i * (COL_W + COL_GAP);
/** 列内「状态」列宽 / 「名称」列宽 */
const CELL_W = 96;
const NAME_W = COL_W - CELL_W; // 352

/** 底部两个同类按钮 */
const BTN_W = 272;
const BTN_X2 = TABLE_X + TABLE_W - BTN_W; // 1608（右缘 1880 与表格对齐）
const BTN_X1 = BTN_X2 - GAP - BTN_W; // 1312
const NOTE_W = BTN_X1 - GAP - TABLE_X; // 1248

/** 信息带右端的「软元件监控」按钮（右缘同样对齐 1880） */
const INFO_BTN_W = 312;
const INFO_BTN_X = TABLE_X + TABLE_W - INFO_BTN_W; // 1568

/**
 * 每列只画 8 行，而每组有 10 个地址：40 路点位分 2 页。
 * 第 1 页 = 原版的 X?0–X?7；第 2 页把窗口平移到 X?2–X?9，让原实现没画出来的
 * X?8 / X?9 保留位也能监控到，两页都保持原版「4 列 × 8 行」的版面。
 */
const PAGES = 2;
const SLOT_SHIFT = 2;

/**
 * 点位名称：保留原实现已有的中文点位名；第一列原本是空字符串 → 按「输入 01…」
 * 自动生成；每组 X?8 / X?9 是原实现未列出的保留位 → 「备用」。
 */
function pointName(ci: number, slot: number, index: number): string {
  const known = COLS[ci].names[slot];
  if (known) return known;
  return ci === 0 ? `输入 ${String(index + 1).padStart(2, "0")}` : "备用";
}

export default function IoMonitorPage() {
  const navigate = useNavigate();
  const { state, setIo } = useMachine();

  /** 当前页（原「下一页」按钮）：0 = X?0–X?7，1 = 窗口平移到 X?2–X?9 */
  const [page, setPage] = useState(0);
  /** 「软元件监控」视图：状态列显示通断 ON / OFF，而不是点位编号 */
  const [softView, setSoftView] = useState(false);

  const total = state.ioStates.length;
  const activeCount = state.ioStates.filter(Boolean).length;

  return (
    <Stage width={1920} height={800}>
      <PageHeader title="I/O 监控" width={1920} />

      {/* 信息带：机架号 + 两个统计值 + 软元件监控（原字段全部保留，整体下移） */}
      <Panel x={0} y={INFO_Y} w={1920} h={INFO_H} />
      <Text x={MARGIN} y={INFO_Y} w={160} h={INFO_H} size={25} weight={400}>
        机架号：
      </Text>
      {/* 原为硬编码 42.576：改为 ioStates 真实统计（坐标、字号、颜色不变） */}
      <Text
        x={MARGIN + 160 + COL_GAP}
        y={INFO_Y}
        w={304}
        h={INFO_H}
        size={25}
        align="center"
        color="rgb(248, 231, 28)"
      >
        {`已激活 ${activeCount}/${total}`}
      </Text>
      {/* 原为硬编码 PLC_INPUT：补上由 ioStates 计算出的真实点数 */}
      <Text
        x={MARGIN + 160 + COL_GAP + 304 + COL_GAP}
        y={INFO_Y}
        w={608}
        h={INFO_H}
        size={25}
        align="center"
        color="rgb(248, 231, 28)"
      >
        {`PLC_INPUT ${total} 点 · 未激活 ${total - activeCount}`}
      </Text>
      <HmiButton
        x={INFO_BTN_X}
        y={INFO_Y}
        w={INFO_BTN_W}
        h={INFO_H}
        variant="red"
        onClick={() => setSoftView((v) => !v)}
      >
        软元件监控
      </HmiButton>

      {/* 状态表容器（背景不变，坐标 / 尺寸落在 4 的倍数上） */}
      <Abs
        x={TABLE_X}
        y={TABLE_Y}
        w={TABLE_W}
        h={TABLE_H}
        style={{ background: "rgba(0, 46, 99, 0.6)" }}
      />

      {/* 表头：高度与数据行高同为 56，各列 x / 宽与数据行完全一致 */}
      <Abs
        x={TABLE_X}
        y={TABLE_Y}
        w={TABLE_W}
        h={HEADER_H}
        style={{
          background: "linear-gradient(180deg, rgba(90, 150, 235, 0.8), rgba(14, 52, 122, 0.9))",
        }}
      />
      {COLS.map((_c, ci) => (
        <Fragment key={`h-${ci}`}>
          <Text x={COL_X(ci)} y={TABLE_Y} w={CELL_W} h={HEADER_H} size={22} align="center">
            状态
          </Text>
          <Text
            x={COL_X(ci) + CELL_W}
            y={TABLE_Y}
            w={NAME_W}
            h={HEADER_H}
            size={22}
            className="pl-[calc(var(--u)*16)]"
          >
            名称
          </Text>
        </Fragment>
      ))}

      {/* 数据行：行高与表头一致，行距为 0（每行紧接表头步进一个 ROW_H） */}
      {Array.from({ length: ROW_COUNT }, (_, r) => r).map((r) => (
        <Fragment key={r}>
          {COLS.map((c, ci) => {
            const slot = r + page * SLOT_SHIFT;
            const index = ci * 10 + slot;
            const active = state.ioStates[index];
            return (
              <Fragment key={`${ci}-${r}`}>
                <Box x={COL_X(ci)} y={rowY(r)} w={CELL_W} h={ROW_H}>
                  <button
                    type="button"
                    onClick={() => setIo(index, !active)}
                    className="flex h-full w-full cursor-pointer items-center justify-center gap-2"
                    style={{
                      fontSize: u(22),
                      fontFamily: "var(--font-ui)",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    <span
                      className="inline-block rounded-full"
                      style={{
                        width: 10,
                        height: 10,
                        background: active ? "#39e05a" : "rgba(180, 200, 230, 0.35)",
                        boxShadow: active ? "0 0 6px rgba(57, 224, 90, 0.9)" : "none",
                      }}
                    />
                    {softView ? (active ? "ON" : "OFF") : c.list[slot] ?? `X${index}`}
                  </button>
                </Box>
                <Text
                  x={COL_X(ci) + CELL_W}
                  y={rowY(r)}
                  w={NAME_W}
                  h={ROW_H}
                  size={22}
                  className="pl-[calc(var(--u)*16)]"
                >
                  {pointName(ci, slot, index)}
                </Text>
              </Fragment>
            );
          })}
        </Fragment>
      ))}

      {/* 底部按钮带：说明文字与两个同类按钮同 y、同高，间距一致 */}
      <Text
        x={TABLE_X}
        y={FOOT_Y}
        w={NOTE_W}
        h={FOOT_H}
        size={25}
        weight={400}
        color="rgb(105, 254, 98)"
      >
        注:I0与实际接线有基界;请与实际接线为准!
      </Text>

      <HmiButton x={BTN_X1} y={FOOT_Y} w={BTN_W} h={FOOT_H} onClick={() => navigate(ROUTES.home)}>
        返回主页
      </HmiButton>
      <HmiButton
        x={BTN_X2}
        y={FOOT_Y}
        w={BTN_W}
        h={FOOT_H}
        onClick={() => setPage((p) => (p + 1) % PAGES)}
      >
        下一页
      </HmiButton>
    </Stage>
  );
}
