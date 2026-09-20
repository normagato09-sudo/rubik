import { ImageResponse } from "next/og";
import { RubikoIcon } from "./icons/rubiko-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<RubikoIcon size={size.width} />, size);
}
