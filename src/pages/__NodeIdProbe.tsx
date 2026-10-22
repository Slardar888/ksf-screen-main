/* 临时探针页：验证"每个 hmi 图元都把 data-node-id 放在 render 的第一个 DOM 元素上"。
   验证完即删（连同 App.tsx 里的临时路由）。 */
import type { ReactNode } from "react";
import {
  Abs,
  ArrowButton,
  Box,
  Clock,
  DarkPanel,
  HmiButton,
  NumberField,
  PageHeader,
  Panel,
  Readout,
  ScreenHeader,
  Stage,
  StatusButton,
  Stepper,
  Text,
  TouchButton,
} from "@/components/hmi/primitives";
import { NavPair, OperationButton } from "@/components/hmi/shared";
import { SealUnitGraphic } from "@/components/hmi/SealUnitGraphic";
import { VerifyPasswordDialog } from "@/components/hmi/VerifyPasswordDialog";

const noop = () => {};

/** 每个被测图元独占一个 Abs 容器，便于断言"它是容器里的第一个 DOM 元素" */
function Slot({ name, x, y, children }: { name: string; x: number; y: number; children: ReactNode }) {
  return (
    <Abs x={x} y={y} w={120} h={40} data-probe={name}>
      {children}
    </Abs>
  );
}

export default function NodeIdProbe() {
  return (
    <Stage width={1280} height={800} data-node-id="nid-Stage">
      <Slot name="Abs" x={0} y={0}>
        <Abs x={0} y={0} w={120} h={40} data-node-id="nid-Abs">
          <Box x={0} y={0} w={120} h={40} />
        </Abs>
      </Slot>
      <Slot name="Box" x={130} y={0}>
        <Box x={0} y={0} w={120} h={40} data-node-id="nid-Box" />
      </Slot>
      <Slot name="Text" x={260} y={0}>
        <Text x={0} y={0} w={120} h={40} data-node-id="nid-Text">
          T
        </Text>
      </Slot>
      <Slot name="Clock" x={390} y={0}>
        <Clock x={0} y={0} w={120} h={40} data-node-id="nid-Clock" />
      </Slot>
      <Slot name="Readout" x={520} y={0}>
        <Readout x={0} y={0} w={120} h={40} value={1} data-node-id="nid-Readout" />
      </Slot>
      <Slot name="NumberField" x={650} y={0}>
        <NumberField x={0} y={0} w={120} h={40} value={1} onChange={noop} data-node-id="nid-NumberField" />
      </Slot>
      <Slot name="Stepper" x={780} y={0}>
        <Stepper x={0} y={0} w={120} h={40} value={1} onChange={noop} data-node-id="nid-Stepper" />
      </Slot>
      <Slot name="ArrowButton" x={910} y={0}>
        <ArrowButton x={0} y={0} w={120} h={40} direction="up" data-node-id="nid-ArrowButton" />
      </Slot>
      <Slot name="HmiButton" x={1040} y={0}>
        <HmiButton x={0} y={0} w={120} h={40} data-node-id="nid-HmiButton">
          B
        </HmiButton>
      </Slot>
      <Slot name="StatusButton" x={0} y={100}>
        <StatusButton x={0} y={0} w={120} h={40} on data-node-id="nid-StatusButton" />
      </Slot>
      <Slot name="Panel" x={130} y={100}>
        <Panel x={0} y={0} w={120} h={40} data-node-id="nid-Panel" />
      </Slot>
      <Slot name="DarkPanel" x={260} y={100}>
        <DarkPanel x={0} y={0} w={120} h={40} data-node-id="nid-DarkPanel" />
      </Slot>
      <Slot name="ScreenHeader" x={390} y={100}>
        <ScreenHeader title="探针" width={120} data-node-id="nid-ScreenHeader" />
      </Slot>
      <Slot name="PageHeader" x={520} y={100}>
        <PageHeader title="探针" width={120} data-node-id="nid-PageHeader" />
      </Slot>
      <Slot name="TouchButton" x={650} y={100}>
        <TouchButton data-node-id="nid-TouchButton">T</TouchButton>
      </Slot>
      <Slot name="NavPair" x={780} y={100}>
        <NavPair data-node-id="nid-NavPair" />
      </Slot>
      <Slot name="OperationButton" x={910} y={100}>
        <OperationButton data-node-id="nid-OperationButton" />
      </Slot>
      <Slot name="SealUnitGraphic" x={1040} y={100}>
        <SealUnitGraphic data-node-id="nid-SealUnitGraphic" />
      </Slot>
      <Slot name="VerifyPasswordDialog" x={0} y={200}>
        <VerifyPasswordDialog open onSuccess={noop} onCancel={noop} data-node-id="nid-VerifyPasswordDialog" />
      </Slot>
    </Stage>
  );
}
