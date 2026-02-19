export type Config = {
  ghostWebhookSecret: string;
  accounts: Creds[];
};
export default Config;

export type BlueskyCreds = {
  type: "bluesky";
  identifier: string;
  password: string;
};

export type MastodonCreds = {
  type: "mastodon";
  url: string;
  accessToken: string;
};

export type TumblrCreds = {
  type: "tumblr";
  token: string;
} & (
  | { consumerKey: string; consumer_key?: never }
  | { consumer_key: string; consumerKey?: never }
) & (
  | { consumerSecret: string; consumer_secret?: never }
  | { consumer_secret: string; consumerSecret?: never }
) & (
  | { tokenSecret: string; token_secret?: never }
  | { token_secret: string; tokenSecret?: never }
) & (
  | { blogIdentifier: string; blog_identifier?: never }
  | { blog_identifier: string; blogIdentifier?: never }
)

export type TwitterCreds = {
  type: "twitter";
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
};

export type Creds = BlueskyCreds | MastodonCreds | TumblrCreds | TwitterCreds;
