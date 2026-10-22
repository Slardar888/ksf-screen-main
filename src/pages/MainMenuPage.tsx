import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HmiButton, PageHeader, Stage } from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import { VerifyPasswordDialog } from "@/components/hmi/VerifyPasswordDialog";

/* ------------------------------------------------------------------ *
 * 主菜单（1920×1080）
 *
 * 1. 标题：套用统一标题条 `PageHeader`，但本页画布更大（1920×1080、磁贴 384×188），
 *    因此底条与字号单独放大（barHeight=72 / titleSize=48，其它页仍是 56 / 37）。
 * 2. 磁贴：仍是 4 列 × 3 行，但尺寸与节奏全部取 4 的倍数 ——
 *    原来高 189、行距 270 都不是 4 的倍数，会被 4px 对齐网格吸附成不等间距。
 *    现改为高 188、行距 268（间隙 80）；横向本来就是 384 宽、96 间隙、48 边距，保持不变。
 * 3. 磁贴文字走大磁贴档（big，字号 50）。
 * ------------------------------------------------------------------ */

/** 四列的 x（间距 96，左右边距 48） */
const COLS = [48, 528, 1008, 1488];
/** 三行的 y（行高 188，行距 268 → 间隙 80） */
const ROWS = [256, 524, 792];
const BW = 384;
const BH = 188;

const ITEMS: { label: string; to: string; guard?: boolean }[] = [
  { label: "操作界面", to: ROUTES.operation },
  { label: "注料设置", to: ROUTES.injection },
  { label: "超级用户", to: ROUTES.superUser },
  { label: "温度设定", to: ROUTES.temp },

  { label: "预置计数", to: ROUTES.preset },
  { label: "接头设置", to: ROUTES.joint },
  { label: "MES", to: ROUTES.mes },
  { label: "管制卡", to: ROUTES.bindingCard },

  { label: "料泵清洗", to: ROUTES.pumpClean },
  { label: "I/O监控", to: ROUTES.io },
  { label: "系统管理员", to: ROUTES.sysAdmin, guard: true },
  { label: "角度监控", to: ROUTES.angle },
];

export default function MainMenuPage() {
  const navigate = useNavigate();
  const [guard, setGuard] = useState(false);

  return (
    <Stage width={1920} height={1080}>
      {/* 主菜单画布 1920×1080、磁贴 384×188，比其它页大一号，
          因此标题条与字号单独放大（其余页面沿用全站统一值） */}
      <PageHeader title="主菜单" width={1920} titleSize={48} barHeight={72} />

      {ITEMS.map((item, i) => (
        <HmiButton
          key={item.label}
          x={COLS[i % 4]}
          y={ROWS[Math.floor(i / 4)]}
          w={BW}
          h={BH}
          big
          variant={item.guard ? "blueTop" : "blue"}
          onClick={() => (item.guard ? setGuard(true) : navigate(item.to))}
        >
          {item.label}
        </HmiButton>
      ))}

      <VerifyPasswordDialog
        open={guard}
        onCancel={() => setGuard(false)}
        onSuccess={() => {
          setGuard(false);
          navigate(ROUTES.sysAdmin);
        }}
      />
    </Stage>
  );
}
