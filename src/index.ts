import * as crypto from "node:crypto";
import express from "express";
import login from "./util/login.js";
import post from "./util/post.js";
import fs from "fs";
import path from "path";
import type { Request } from "express";
import type Config from "./types/Config.js";

// if we're building this, we set this env flag to skip the c
if (process.env.GHOSTPOSTER_BUILDING) {
  console.log("skipping config check and app setup.");
} else {
  const configPath = path.join(process.cwd(), "/config.json");

  let config: Config;

  if (fs.existsSync(configPath)) {
    const data = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(data);

    console.log(config);
  } else {
    throw new Error("Configuration file does not exist!");
  }

  const app = express();
  const port = 3000;

  app.use(express.json({ limit: "100mb" }));

  // if we're missing GHOST_WEBHOOK_SECRET we can't verify that hooks are actually coming from ghost. Abort.
  if (!config.ghostWebhookSecret) {
    throw new Error(
      "ghostWebhookSecret not found in config. Create the webhook again, making sure to set a secret, and add it to the config.json file.",
    );
  }

  const clients = await login(config.accounts as Config["accounts"]);
  if (clients.logins === 0) {
    throw new Error("\nNo successful logins... Aborting.");
  }

  // endpoint receiving the webhook
  app.post("/hook", (req, res) => {
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
}
