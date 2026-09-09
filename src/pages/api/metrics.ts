import type { NextApiRequest, NextApiResponse } from "next";

type MetricsResponse = {
  ok: true;
  received: boolean;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MetricsResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(202).json({
    ok: true,
    received: true,
  });
}
