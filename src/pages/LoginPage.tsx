import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Abs, Box, Stage } from "@/components/hmi/primitives";
import { ROUTES } from "@/components/hmi/shared";
import {
  BAR,
  BTN,
  BTN_PAD,
  BTN_VARIANT,
  CHIP,
  INPUT,
  INPUT_PLAIN,
  STAT_LABEL,
} from "@/components/hmi/styles";
import { cn } from "@/lib/utils";
import { DEMO_CREDENTIALS, signIn, verifyCredentials } from "@/lib/auth";

/* ------------------------------------------------------------------ *
 * 登录页（1920×1080）
 *
 * 版面与改造前逐一对应：
 *   左侧品牌区 (96,81,1037,918)／右侧登录面板 (1133,81,691,918)
 *   面板内：logo+标题 (215,235)、语言 (575,27)、表单卡片 (86,329) 宽 518
 * 卡片内部原本就是流式排版（非绝对定位），因此用 <Box> 定位 + 内部常规流式，
 * 尺寸用 calc(var(--u) * 原px) 保持与设计稿一致的比例。
 * ------------------------------------------------------------------ */

const CARD_W = 518;

/** 原画布 px → 当前视口尺寸 */
const u = (v: number | string) => `calc(var(--u) * ${v})`;

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>(DEMO_CREDENTIALS.username);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.password);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCredentials(username, password)) {
      setError("用户名或密码错误");
      return;
    }
    signIn();
    navigate(ROUTES.home, { replace: true });
  };

  return (
    <Stage width={1920} height={1080}>
      {/* ---------------- 左侧品牌区（原为 login-art.png，现用 CSS 科技图形） ---------------- */}
      <Box
        x={96}
        y={81}
        w={1037}
        h={918}
        className="flex flex-col justify-center overflow-hidden rounded-card border border-hmi-line bg-[radial-gradient(600px_320px_at_12%_8%,rgba(56,232,255,0.14),transparent_62%),radial-gradient(520px_300px_at_92%_96%,rgba(123,108,255,0.14),transparent_60%),linear-gradient(180deg,rgba(14,38,74,0.6),rgba(6,18,36,0.7))] backdrop-blur-[10px]"
        style={{ gap: u(28), padding: `${u(60)} ${u(72)}` }}
      >
        <span
          className={CHIP}
          style={{ fontSize: u(20), padding: `${u(8)} ${u(20)}`, alignSelf: "flex-start" }}
        >
          工业触摸屏 · 现场控制系统
        </span>
        <div
          className="font-bold tracking-[0.06em] text-[#f2f8ff] [text-shadow:0_0_34px_rgba(56,232,255,0.45)]"
          style={{ fontSize: u(76), lineHeight: 1.1 }}
        >
          MES 触摸屏系统
        </div>
        <p
          className="text-hmi-unit"
          style={{ fontSize: u(28), lineHeight: 1.6, maxWidth: u(760) }}
        >
          面向酱包包装产线的现场操作终端：实时采集 PLC 数据，集中管理注料、
          封口温度、计数与排程。
        </p>
        <div className="flex flex-wrap" style={{ gap: u(20) }}>
          {[
            { k: "机台", v: "JB301" },
            { k: "产线速度", v: "120 袋/分" },
            { k: "采集点位", v: "40 路 I/O" },
          ].map((s) => (
            <div
              key={s.k}
              className={cn(BAR, "flex flex-col")}
              style={{ padding: `${u(16)} ${u(24)}`, gap: u(8), minWidth: u(220) }}
            >
              <span className={STAT_LABEL} style={{ fontSize: u(20) }}>
                {s.k}
              </span>
              <span
                className="font-tech tabular-nums text-hmi-cyan"
                style={{ fontSize: u(32) }}
              >
                {s.v}
              </span>
            </div>
          ))}
        </div>
      </Box>

      {/* ---------------- 右侧登录面板 ---------------- */}
      <Abs
        x={1133}
        y={81}
        w={691}
        h={918}
        className="rounded-r-[20px] border border-hmi-line bg-gradient-to-b from-[rgba(12,36,70,0.9)] to-[rgba(6,18,36,0.94)] backdrop-blur-[14px] backdrop-saturate-[1.2] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.95)]"
      >
        {/* logo + 标题：(215,235) */}
        <Box
          x={215}
          y={235}
          w={330}
          h={70}
          className="flex items-center"
          style={{ gap: u(12) }}
        >
          <span
            className="flex flex-none items-center justify-center rounded-[14px] p-2 bg-gradient-to-b from-[rgba(56,232,255,0.95)] to-[rgba(28,108,224,0.95)] font-tech font-bold text-[#02121f] shadow-[0_0_24px_-6px_rgba(56,232,255,0.7)]"
            style={{ width: u(72), height: u(72), fontSize: u(32) }}
          >
            M
          </span>
          <span
            style={{
              fontSize: u(28),
              fontWeight: 500,
              lineHeight: u(44),
              color: "#eaf4ff",
            }}
          >
            MES触摸屏系统
          </span>
        </Box>

        {/* 语言：(575,27) */}
        <Box
          x={575}
          y={27}
          w={110}
          h={30}
          className="flex cursor-pointer items-center justify-end"
          style={{ fontSize: u(20), color: "rgb(105, 105, 105)", paddingInline: u(12) }}
        >
          简体中文
        </Box>

        {/* 表单卡片：(86,329) 宽 518 —— 内部保持原始流式排版 */}
        <Box
          x={86}
          y={329}
          w={CARD_W}
          className="border border-hmi-line bg-[rgba(8,24,48,0.72)] backdrop-blur-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          style={{ borderRadius: u(4) }}
        >
          <form onSubmit={submit} style={{ width: "100%" }}>
            <div style={{ padding: `${u(20)} 0 ${u(24)}` }}>
              {/* 用户名 */}
              <label className="flex flex-col flex flex-col">
                <span style={{ fontSize: u(16), color: "rgb(82, 85, 102)" }}>
                  <span style={{ color: "rgb(255, 77, 79)", marginRight: u(4) }}>*</span>
                  用户名
                </span>
                <input
                  className={cn(INPUT, INPUT_PLAIN, "border border-transparent px-[0.6em] text-left text-[#0a1a30] focus:border-hmi-cyan focus:shadow-[0_0_18px_-6px_rgba(56,232,255,0.7)]")}
                  style={{
                    height: u(56),
                    marginTop: u(8),
                    borderRadius: u(8),
                    fontSize: u(34),
                    background: "rgb(240, 241, 243)",
                  }}
                  value={username}
                  autoComplete="username"
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                />
              </label>

              {/* 密码 */}
              <label className="flex flex-col flex flex-col" style={{ marginTop: u(24) }}>
                <span style={{ fontSize: u(16), color: "rgb(82, 85, 102)" }}>
                  <span style={{ color: "rgb(255, 77, 79)", marginRight: u(4) }}>*</span>
                  密码
                </span>
                <input
                  type="password"
                  className={cn(INPUT, INPUT_PLAIN, "border border-transparent px-[0.6em] text-left text-[#0a1a30] focus:border-hmi-cyan focus:shadow-[0_0_18px_-6px_rgba(56,232,255,0.7)]")}
                  style={{
                    height: u(56),
                    marginTop: u(8),
                    borderRadius: u(8),
                    fontSize: u(34),
                    background: "rgb(240, 241, 243)",
                  }}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                />
              </label>

              {error ? (
                <div
                  role="alert"
                  style={{
                    marginTop: u(12),
                    fontSize: u(12),
                    color: "rgb(255, 77, 79)",
                  }}
                >
                  {error}
                </div>
              ) : null}

              {/* 记住我 */}
              <button
                type="button"
                role="checkbox"
                aria-checked={remember}
                className="flex items-center"
                style={{ marginTop: u(36), gap: u(8) }}
                onClick={() => setRemember((v) => !v)}
              >
                <span
                  aria-hidden
                  style={{
                    width: u(16),
                    height: u(16),
                    borderRadius: u(4),
                    flex: "0 0 auto",
                    border: `1px solid ${remember ? "transparent" : "var(--color-hmi-line)"}`,
                    background: remember
                      ? "linear-gradient(180deg, rgba(56,232,255,.9), rgba(28,108,224,.9))"
                      : "rgb(240, 241, 243)",
                  }}
                />
                <span style={{ fontSize: u(12), color: "rgb(170, 171, 179)" }}>记住我</span>
              </button>

              {/* 登录 */}
              <div style={{ marginTop: u(32) }}>
                <button
                  type="submit"
                  className={cn(BTN, BTN_VARIANT.primary, BTN_PAD, "w-full")}
                  style={{
                    height: u(56),
                    borderRadius: u(8),
                    fontSize: u(28),
                  }}
                >
                  登 录
                </button>
              </div>
            </div>
          </form>
        </Box>
      </Abs>
    </Stage>
  );
}
