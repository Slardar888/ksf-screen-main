import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { TouchButton, type Passthrough } from "@/components/hmi/primitives";
import {
  BRACKET,
  DLG_FIELD,
  DLG_FIELD_INPUT,
  DLG_HEAD,
  DLG_PANEL,
  DLG_TITLE,
  INPUT,
  INPUT_PLAIN,
  ROW_LABEL,
  STAT_LABEL,
} from "@/components/hmi/styles";
import { cn } from "@/lib/utils";
import { verifyAdminPassword } from "@/lib/auth";

/* ------------------------------------------------------------------ *
 * 管理员身份验证弹窗
 * 改进点：
 *  - 由「画布内自绘气泡」改为铺满视口的 flex 居中模态层，任意屏幕尺寸都居中；
 *  - 口令错误时给出明确反馈（原实现静默关闭，用户无法判断是否失败）；
 *  - 触摸目标提升到 --hmi-h-ctl（原为 32px，远低于触摸屏规范）。
 * ------------------------------------------------------------------ */
export function VerifyPasswordDialog({
  open,
  onSuccess,
  onCancel,
  title = "管理员身份验证",
  description = "进入系统管理员页面前需要校验口令",
  ...rest
}: {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
} & Passthrough) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setError("");
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      onSuccess();
      return;
    }
    setError("口令不正确，请重新输入");
    setPassword("");
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,8,18,0.72)] p-6 backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      {...rest}
    >
      <form
        onSubmit={submit}
        className={cn(DLG_PANEL, BRACKET, "w-full max-w-[min(92vw,30rem)]")}
      >
        <div className={DLG_HEAD}>
          <h2 className={DLG_TITLE}>
            <ShieldCheck aria-hidden className="size-[1.1em] text-hmi-cyan" />
            {title}
          </h2>
        </div>

        <p className={ROW_LABEL}>{description}</p>

        <label className="flex flex-col gap-2">
          <span className={STAT_LABEL}>管理员口令</span>
          <div className={DLG_FIELD}>
            <Lock aria-hidden className="size-[1.1em] shrink-0 text-hmi-unit" />
            <input
              ref={inputRef}
              type="password"
              className={cn(INPUT, INPUT_PLAIN, DLG_FIELD_INPUT)}
              value={password}
              autoComplete="current-password"
              placeholder="请输入口令"
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
            />
          </div>
        </label>

        {error ? (
          <p
            role="alert"
            className="text-sm text-hmi-live"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <TouchButton
            variant="ghost"
            type="button"
            onClick={onCancel}
            className="flex-1 basis-[8rem]"
          >
            取消
          </TouchButton>
          <TouchButton
            variant="primary"
            type="submit"
            className="flex-1 basis-[8rem]"
          >
            确认进入
          </TouchButton>
        </div>
      </form>
    </div>
  );
}
