import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 * 设备实时数据（还原自现场触摸屏，数值带轻微抖动以模拟真实 PLC 上报）
 * ------------------------------------------------------------------ */

export type ToggleKey =
  | "countFunction"
  | "suckBack"
  | "rollerCount"
  | "emptyAlarm"
  | "emptyAlarmMode"
  | "markAlarm"
  | "markAlarmMode"
  | "presetCount"
  | "jointDetect"
  | "jointMode"
  | "pumpSauce"
  | "pumpLiquid"
  | "tempStop"
  | "filmAlarm"
  | "butterflyValve"
  | "mark"
  | "heat";

export interface MachineState {
  /** 工单信息 */
  machineNo: string;
  productName: string;
  productCode: string;
  workOrder: string;

  /** 操作画面 */
  speedSet: number;
  bagLengthSet: number;
  outputCount: number;
  rollerCount: number;
  sealVInner: number;
  sealHInner: number;
  sealVOuter: number;
  sealHOuter: number;
  markPos: number;
  coldPos: number;

  /** 注料设置（参数设置） */
  sauceStartAngle: number;
  sauceHoldTime: number;
  suckStartAngle: number;
  suckHoldAngle: number;
  coarseTurns: number;
  currentPos: number;

  /** 温度设定 */
  temps: Record<string, { pv: number; sv: number }>;
  als: number[];

  /** 预置计数 */
  presetBags: number;
  currentBags: number;
  countMode: "cycle" | "alarmStop";

  /** 接头检测 */
  jointLength: number;
  jointSeconds: number;
  stopBeforeBags: number;
  stopBags: number;

  /** 料泵清洗 */
  cleanSpeed: number;
  cleanTime: number;
  cleanRemain: number;
  sealRunSpeed: number;

  /** 超级管理员调试 */
  crossSealPos: number;

  /** 系统管理员参数 */
  sysParams: Record<string, number>;
  currentPumpBags: number;

  /** I/O 监控 */
  ioStates: boolean[];

  toggles: Record<ToggleKey, boolean>;

  /** MES 计划排程 */
  schedule: {
    machine: string;
    shift: string;
    productCode: string;
    workOrder: string;
    operator: string;
    stdSpeed: string;
    package: string;
    stdBagLength: string;
    weight: string;
    packQty: string;
    weightLow: string;
    weightHigh: string;
  };

  /** 管制卡 */
  card: {
    date: string;
    machine: string;
    productName: string;
    productCode: string;
    shift: string;
    operator: string;
    material: string;
    stdBagLength: string;
    packQty: number;
    serial: string;
  };
}

const jitter = (v: number, amp = 0.004) => {
  const n = v + (Math.random() - 0.5) * amp * 2;
  return Number.isFinite(n) ? n : v;
};
const fmt = (v: number, d: number) => Number(v.toFixed(d));

const initialState: MachineState = {
  machineNo: "JB301",
  productName: "经典红烧牛肉桶面酱包",
  productCode: "1502AT11B",
  workOrder: "110922521",

  speedSet: 3.8,
  bagLengthSet: 7.9,
  outputCount: 57.232,
  rollerCount: 48.466,
  sealVInner: 9.3,
  sealHInner: 3.8,
  sealVOuter: 8.5,
  sealHOuter: 9.6,
  markPos: 29,
  coldPos: 44,

  sauceStartAngle: 65,
  sauceHoldTime: 0.35,
  suckStartAngle: 25,
  suckHoldAngle: 99,
  coarseTurns: 1,
  currentPos: 2.913,

  temps: {
    vInner: { pv: 9.285, sv: 2.7417 },
    hInner: { pv: 3.752, sv: 6.8058 },
    vOuter: { pv: 8.494, sv: 8.3962 },
    hOuter: { pv: 9.588, sv: 2.901 },
  },
  als: [1.5759, 8.846, 0.926, 8.902],

  presetBags: 20,
  currentBags: 0.95986,
  countMode: "cycle",

  jointLength: 1.5,
  jointSeconds: 50.766,
  stopBeforeBags: 33.621,
  stopBags: 10.719,

  cleanSpeed: 30,
  cleanTime: 5,
  cleanRemain: 22.457,
  sealRunSpeed: 50,

  crossSealPos: 48.117,

  sysParams: {
    rollerConst: 50,
    speedMax: 120,
    stopPos: 180,
    speedMin: 10,
    bagLenMax: 200,
    bagLenMin: 50,
    heatOffMinutes: 30,
    pumpMaintainBags: 5000,
  },
  currentPumpBags: 95.986,

  ioStates: Array.from({ length: 40 }, (_, i) => i === 20 || i === 21 || i === 33),

  toggles: {
    countFunction: false,
    suckBack: false,
    rollerCount: false,
    emptyAlarm: false,
    emptyAlarmMode: true,
    markAlarm: false,
    markAlarmMode: true,
    presetCount: false,
    jointDetect: true,
    jointMode: true,
    pumpSauce: false,
    pumpLiquid: false,
    tempStop: false,
    filmAlarm: false,
    butterflyValve: false,
    mark: false,
    heat: false,
  },

  schedule: {
    machine: "JB301",
    shift: "当前班",
    productCode: "1502AT11B",
    workOrder: "110922521",
    operator: "周税",
    stdSpeed: "120",
    package: "醇香肉酱包16Y",
    stdBagLength: "80",
    weight: "16",
    packQty: "24",
    weightLow: "15.5",
    weightHigh: "16.5",
  },

  card: {
    date: "2026-09-11",
    machine: "JB301",
    productName: "经典红烧牛肉桶面酱包",
    productCode: "1502AT11B",
    shift: "早",
    operator: "周税",
    material: "醇香肉酱包16Y",
    stdBagLength: "80",
    packQty: 24,
    serial: "001",
  },
};

interface Ctx {
  state: MachineState;
  set: <K extends keyof MachineState>(key: K, value: MachineState[K]) => void;
  toggle: (key: ToggleKey) => void;
  setTemp: (key: string, field: "pv" | "sv", value: number) => void;
  setIo: (index: number, value: boolean) => void;
  resetCount: (key: "outputCount" | "rollerCount") => void;
}

const MachineContext = createContext<Ctx | null>(null);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MachineState>(() => structuredClone(initialState));
  const tickRef = useRef<number>(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      tickRef.current += 1;
      setState((s) => ({
        ...s,
        outputCount: fmt(jitter(s.outputCount, 0.6), 3),
        rollerCount: fmt(jitter(s.rollerCount, 0.6), 3),
        sealVInner: fmt(jitter(s.sealVInner, 0.05), 1),
        sealHInner: fmt(jitter(s.sealHInner, 0.05), 1),
        sealVOuter: fmt(jitter(s.sealVOuter, 0.05), 1),
        sealHOuter: fmt(jitter(s.sealHOuter, 0.05), 1),
        currentBags: fmt(jitter(s.currentBags, 0.02), 5),
        jointSeconds: fmt(jitter(s.jointSeconds, 0.05), 3),
        cleanRemain: Math.max(0, fmt(s.cleanRemain - 0.01, 3)),
        crossSealPos: fmt(jitter(s.crossSealPos, 0.02), 3),
        currentPos: fmt(jitter(s.currentPos, 0.003), 3),
        currentPumpBags: fmt(jitter(s.currentPumpBags, 0.02), 3),
        temps: Object.fromEntries(
          Object.entries(s.temps).map(([k, v]) => [k, { pv: fmt(jitter(v.pv, 0.02), 3), sv: v.sv }]),
        ),
      }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      set: (key, val) => setState((s) => ({ ...s, [key]: val })),
      toggle: (key) =>
        setState((s) => ({ ...s, toggles: { ...s.toggles, [key]: !s.toggles[key] } })),
      setTemp: (key, field, val) =>
        setState((s) => ({
          ...s,
          temps: { ...s.temps, [key]: { ...s.temps[key], [field]: val } },
        })),
      setIo: (index, val) =>
        setState((s) => {
          const next = [...s.ioStates];
          next[index] = val;
          return { ...s, ioStates: next };
        }),
      resetCount: (key) => setState((s) => ({ ...s, [key]: 0 })),
    }),
    [state],
  );

  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>;
}

export function useMachine() {
  const ctx = useContext(MachineContext);
  if (!ctx) throw new Error("useMachine must be used inside MachineProvider");
  return ctx;
}
