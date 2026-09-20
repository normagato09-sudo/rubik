import { ImageResponse } from "next/og";
import { RubikoIcon } from "../rubiko-icon";

const SIZE = 512;

export async function GET() {
  return new ImageResponse(<RubikoIcon size={SIZE} />, {
    width: SIZE,
    height: SIZE,
  });
}
