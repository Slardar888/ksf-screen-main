import { Fragment } from "react";
import { PageHeader, Panel, Readout, Stage, Text } from "@/components/hmi/primitives";
import { NavPair } from "@/components/hmi/shared";
import { useMachine } from "@/store";

/* ------------------------------------------------------------------ *
 * 角度监控（1280×800）
 *
 * 版面按全站统一标准整理（只调坐标 / 尺寸，不改文案、不增删元素）：
 *
 *  1. 标题：原 `<PlainTitle title="角度监控" />` → 统一标题条
 *     `<PageHeader title="角度监控" width={1280} />`（底条 0..56、字号 50、居中、右上角时钟）。
 *
 *  2. 卡片尺寸：Panel 统一 512×140（原 510×140，取 4 的倍数额）。
 *     两张卡片在 1280 画布上左右对称：左列 x=104、右列 x=664，
 *     右缘 1176，左右留白都是 104。
 *
 *  3. 卡片间距：横向与纵向共用同一个常数 GAP=48（4 的倍数），因此
 *     两列的 x 与宽度完全一致（104 / 664，w=512），
 *     三行的 y 与高度完全一致（144 / 332 / 520，h=140，步长 188）。
 *     原稿横向间距 28、纵向间距 40，两者不等。
 *
 *  4. 卡片起始 y=144：在标题条（0..56）之下，且是 4 的倍数；
 *     整块卡片区 144..660，距标题条 88、距画布底边 140；
 *     首行标签托板（160..212）与右上角导航按钮（y=212 起）刚好不相交。
 *
 *  5. 卡片内部：标签 / 数值 / 单位三者用同一组常量
 *     （标签 x=卡内 +16 w=480 h=52；数值 x=+16 w=328 h=52；单位 x=+352 w=144），
 *     因此六张卡片的三者 x/w 完全一致；数值格子等宽同起点、左对齐，
 *     六张卡片的数值共用两条竖轴（左列中心 284 / 右列中心 844）。
 *     数值改用 `Readout`（代替原 `<Text font="led" size={50}>`，样式与全站数值统一）。
 * ------------------------------------------------------------------ */

const CARD_W = 512;
const CARD_H = 140;
/** 横向与纵向共用同一个卡片间距 */
const CARD_GAP = 48;

const COL_X0 = 104;
const COL_STEP = CARD_W + CARD_GAP; // 560
const ROW_Y0 = 144;
const ROW_STEP = CARD_H + CARD_GAP; // 188
const cardX = (col: number) => COL_X0 + col * COL_STEP; // 104 / 664
const cardY = (row: number) => ROW_Y0 + row * ROW_STEP; // 144 / 332 / 520

/** 卡片内部（相对卡片左上角，全部取 4 的倍数） */
const PAD = 16;
const LABEL_DY = 16;
const LABEL_H = 52;
const LABEL_W = CARD_W - 2 * PAD; // 480
const DATA_DY = 72;
const DATA_H = 52;
const VAL_DX = PAD; // 16
const VAL_W = 328;
const UNIT_DX = PAD + VAL_W + 8; // 352
const UNIT_W = CARD_W - UNIT_DX - PAD; // 144

export default function AngleMonitorPage() {
  const { state } = useMachine();

  const items = [
    { label: "纵封内侧角度", value: state.sealVInner * 10, unit: "°" },
    { label: "横封内侧角度", value: state.sealHInner * 10, unit: "°" },
    { label: "纵封外侧角度", value: state.sealVOuter * 10, unit: "°" },
    { label: "横封外侧角度", value: state.sealHOuter * 10, unit: "°" },
    { label: "横封位置", value: state.crossSealPos, unit: "mm" },
    { label: "计量当前位置", value: state.currentPos, unit: "圈" },
  ];

  return (
    <Stage width={1280} height={800}>
      <PageHeader title="角度监控" width={1280} />

      {items.map((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = cardX(col);
        const y = cardY(row);
        /**
         * 原实现用 `<div key={item.label}>` 包裹每个监控项：这个 div 会变成一个
         * 没有坐标的网格项，把里面的 Panel / Text 挤进无尺寸子网格而错位。
         * 这里改用 Fragment（不产生 DOM 节点），让 Panel / Readout / Text 成为画布的
         * 直接子元素，坐标、顺序、成组关系与原实现完全一致。
         */
        return (
          <Fragment key={item.label}>
            <Panel x={x} y={y} w={CARD_W} h={CARD_H} />
            <Text
              x={x + PAD}
              y={y + LABEL_DY}
              w={LABEL_W}
              h={LABEL_H}
              size={36}
              plate
            >
              {item.label}
            </Text>
            <Readout
              x={x + VAL_DX}
              y={y + DATA_DY}
              w={VAL_W}
              h={DATA_H}
              value={item.value}
              digits={3}
            />
            <Text x={x + UNIT_DX} y={y + DATA_DY} w={UNIT_W} h={DATA_H} size={32}>
              {item.unit}
            </Text>
          </Fragment>
        );
      })}

      <NavPair />
    </Stage>
  );
}
