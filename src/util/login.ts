import { AtpAgent } from "@atproto/api";
import { createRestAPIClient } from "masto";
import type { mastodon } from "masto";
import type Config from "../types/Config.js";
import * as tumblr from "tumblr.js";
import { TwitterApi, TwitterApiReadWrite } from "twitter-api-v2";

export type CustomTumblrClient = {
  client: tumblr.Client;
  blogIdentifier: string;
};

export type Clients = {
  bluesky: AtpAgent[];
  mastodon: mastodon.rest.Client[];
  tumblr: CustomTumblrClient[];
  twitter: TwitterApiReadWrite[];
  logins: number;
};

export default async function login(accounts: Config["accounts"]) {
  const clients: Clients = {
    bluesky: [],
    mastodon: [],
    tumblr: [],
    twitter: [],
    logins: 0,
  };

  const loginFails = { bluesky: 0, mastodon: 0, tumblr: 0, twitter: 0 };

  const parsedAccounts = parseAccounts(accounts);

  for (const { identifier, password } of parsedAccounts.bluesky) {
    try {
      const client = new AtpAgent({
        service: "https://bsky.social",
      });

      await client.login({
        identifier,
        password,
      });

      console.log(`Logged in to @${client.session!.handle} on bluesky.`);

      clients.bluesky.push(client);
      clients.logins++;
    } catch (e) {
      console.error(`\n[err] Failed login to bluesky account ${identifier}`);
      console.group();
      console.log(e);
      console.groupEnd();
      loginFails.bluesky++;
    }
  }

  for (const { url, accessToken } of parsedAccounts.mastodon) {
    try {
      const client = createRestAPIClient({
        url,
        accessToken,
      });

      const me = await client.v1.accounts.verifyCredentials();

      console.log(`Logged in to @${me.acct} (${me.url}) on mastodon.`);

      clients.mastodon.push(client);
      clients.logins++;
    } catch (e) {
      console.error(
        `\n[err] Failed login to mastodon account with access token ${accessToken} at ${url}`,
      );
      console.group();
      console.log(e);
      console.groupEnd();
      loginFails.mastodon++;
    }
  }

  for (const {
    consumerKey,
    consumer_key,
    consumerSecret,
    consumer_secret,
    token,
    tokenSecret,
    token_secret,
    blogIdentifier,
    blog_identifier,
  } of parsedAccounts.tumblr) {
    try {
      const id = blogIdentifier || blog_identifier;

      if (!id) {
        throw new Error("blogIdentifier not set for current account.");
      }

      const client = tumblr.createClient({
        consumer_key: consumerKey || consumer_key,
        consumer_secret: consumerSecret || consumer_secret,
        token: token,
        token_secret: tokenSecret || token_secret,
      });

      await client.userInfo();

      const me = await client.blogInfo(id);

      console.log(`Logged in to @${me.blog.title} on tumblr.`);

      clients.tumblr.push({ client, blogIdentifier: id });
      clients.logins++;
    } catch (e) {
      console.error(
        `\n[err] Failed login to tumblr account with token ${token}`,
      );
      console.group();
      console.log(e);
      console.groupEnd();
      loginFails.tumblr++;
    }
  }

  for (const {
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  } of parsedAccounts.twitter) {
    try {
      const client = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
      });

      const rwClient = client.readWrite;

      const me = await client.currentUser();

      console.log(`Logged in to @${me.screen_name} on twitter.`);

      clients.twitter.push(rwClient);
      clients.logins++;
    } catch (e) {
      console.error(
        `\n[err] Failed login to twitter account with accessToken ${accessToken}`,
      );
      console.group();
      console.log(e);
      console.groupEnd();
      loginFails.twitter++;
    }
  }
  console.group("\nlogins:");
  console.log(
    `bluesky: ${clients.bluesky.length} successful, ${loginFails.bluesky} failed;`,
  );
  console.log(
    `mastodon: ${clients.mastodon.length} successful, ${loginFails.mastodon} failed;`,
  );
  console.log(
    `tumblr: ${clients.tumblr.length} successful, ${loginFails.tumblr} failed;`,
  );
  console.log(
    `twitter: ${clients.twitter.length} successful, ${loginFails.twitter} failed.`,
  );
  console.groupEnd();

  return clients;
}

function parseAccounts(accounts: Config["accounts"]) {
  const parsedAccounts = {
    bluesky: accounts.filter((a) => a.type === "bluesky"),
    mastodon: accounts.filter((a) => a.type === "mastodon"),
    tumblr: accounts.filter((a) => a.type === "tumblr"),
    twitter: accounts.filter((a) => a.type === "twitter"),
  };

  return parsedAccounts;
}
