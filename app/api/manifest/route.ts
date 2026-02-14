import { NextResponse } from "next/server";
import config from "@/minikit.config";

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjExNDg5NzEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMTMwOTViRDIzM2U1ZDgzQzY1NTA3NjVhMUVjRDkzYzMzNDFCNEQ1In0",
      payload: "eyJkb21haW4iOiJyb2FzdC1tZS1waGkudmVyY2VsLmFwcCJ9",
      signature: "PLACEHOLDER_SIGN_WITH_WARPCAST_AFTER_DEPLOY",
    },
    ...config,
  };

  return NextResponse.json(manifest);
}
