import { ImageResponse } from "next/og";
import { RubikoIcon } from "../rubiko-icon";

const SIZE = 192;

export async function GET() {
  return new ImageResponse(<RubikoIcon size={SIZE} />, {
    width: SIZE,
    height: SIZE,
  });
}
