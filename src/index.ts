import * as crypto from "node:crypto";
import express from "express";
import login from "./util/login";
import post from "./util/post";
import config from "../config.json";
import type { Request } from "express";

const app = express();
const port = 3000;

// if we're missing GHOST_WEBHOOK_SECRET we can't verify that hooks are actually coming from ghost. Abort.
if (!config.ghostWebhookSecret) {
  throw new Error(
    "ghostWebhookSecret not found in config. Create the webhook again, making sure to set a secret, and add it to the config.json file.",
  );
}

const clients = await login(config.accounts);
if (clients.logins === 0) {
  throw new Error("\nNo successful logins... Aborting.");
}

// endpoint receiving the webhook
app.post("/hook", express.json(), (req, res) => {
  const signatureHeader = req.headers["x-ghost-signature"] as
    | string
    | undefined;

  if (
    !signatureHeader ||
    !verifyWebhook(req.body, signatureHeader, config.ghostWebhookSecret)
  ) {
    console.error(
      "\n[WARN] received unauthorized webhook",
      req.body,
      req.headers,
    );
    return res.status(401).send("Unauthorized");
  }

  res.status(200).send("OK");

  post(req.body.post.current, clients);
});

function verifyWebhook(
  body: Request["body"],
  signatureHeader: string,
  secret: string,
) {
  const { sha256: signature, t: timestamp } = Object.fromEntries(
    signatureHeader
      .split(", ")
      .map((pair) => pair.split("=").map((item) => item.trim())),
  );

  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${JSON.stringify(body)}${timestamp}`)
    .digest("hex");

  return computedSignature === signature;
}

app.get("/hook", (_req, res) => {
  res
    .status(200)
    .send(
      "<p>ghostposter is listening!</p><br><a target='_blank' href='https://github.com/limesdotpink/ghostposter'>source code</p>",
    );
});

app.listen(port, () => {
  console.log(`\nghostposter listening on http://localhost:${port}/hook`);
});
