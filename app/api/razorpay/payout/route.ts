// Payouts are disabled in this repository/demo.
//
// Rationale: real payouts require the platform to be a registered business and
// complete Razorpay KYC (beneficiary/fund account onboarding). For this college
// project we intentionally disable the payout flow to avoid storing or
// attempting live transfers. Keep this stub instead of deleting the file so
// callers get a clear 501 response and the project history remains intact.

import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Payouts are disabled in this demo/college project. The platform payout flow requires business KYC and is intentionally disabled.",
    },
    { status: 501 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: "Payouts disabled (demo)." },
    { status: 501 }
  )
}
