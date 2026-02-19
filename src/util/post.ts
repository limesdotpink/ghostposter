import type { AtpAgent } from "@atproto/api";
import { RichText } from "@atproto/api";
import sharp from "sharp";
import type { mastodon as mastoType } from "masto";
import type { TwitterApiReadWrite } from "twitter-api-v2";
import type { Clients, CustomTumblrClient } from "./login.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function post(blogpost: any, clients: Clients) {
  for (const client of clients.bluesky) {
    await bluesky(client, blogpost);
  }

  for (const client of clients.mastodon) {
    await mastodon(client, blogpost);
  }

  for (const client of clients.tumblr) {
    await tumblr(client, blogpost);
  }

  for (const client of clients.twitter) {
    await twitter(client, blogpost);
  }

  return clients;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function bluesky(client: AtpAgent, blogpost: any, imageQuality = 100) {
  try {
    const formattedPost = `${blogpost.title}\n\n${blogpost.url}`;

    const blob = await fetch(blogpost.feature_image).then((r) => r.blob());

    const compressedImage = await sharp(await blob.arrayBuffer())
      .resize(1200, 675)
      .jpeg({ quality: imageQuality })
      .toBuffer();

    const { data } = await client.uploadBlob(compressedImage, {
      encoding: "image/jpeg",
    });

    const rt = new RichText({
      text: formattedPost,
    });
    await rt.detectFacets(client);

    await client.post({
      $type: "app.bsky.feed.post",
      text: rt.text,
      facets: rt.facets,
      langs: ["en-US"],
      embed: {
        $type: "app.bsky.embed.external",
        external: {
          uri: blogpost.url,
          title: blogpost.title,
          description: blogpost.excerpt,
          thumb: data.blob,
        },
      },

      createdAt: new Date().toISOString(),
    });

    console.log(`[info]: posted to bluesky - @${client.session!.handle}`);
  } catch (e) {
    // if the image is too large we set a lower compression level
    if (e.error === "BlobTooLarge") {
      const newImageQuality = imageQuality - 10;
      console.error(
        `[info] bluesky: image too large, retrying with compression level ${
          newImageQuality
        }`,
      );

      await bluesky(client, blogpost, newImageQuality);
    } else {
      console.error("[ERROR] bluesky:\n", e);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mastodon(client: mastoType.rest.Client, blogpost: any) {
  try {
    const formattedPost = `${blogpost.title}\n\n${blogpost.url}`;

    await client.v1.statuses.create({
      status: formattedPost,
    });

    const me = await client.v1.accounts.verifyCredentials();

    console.log(`[info]: posted to mastodon - ${me.acct}`);
  } catch (e) {
    console.error("[ERROR] mastodon:\n", e);
  }
}

async function tumblr(
  { client, blogIdentifier }: CustomTumblrClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blogpost: any,
) {
  try {
    await client.createPost(blogIdentifier, {
      content: [
        {
          type: "text",
          text: blogpost.title,
        },
        {
          type: "text",
          text: blogpost.url,
          formatting: [
            {
              start: 0,
              end: blogpost.url.length,
              type: "link",
              url: blogpost.url,
            },
          ],
        },
      ],
    });

    const me = await client.blogInfo(blogIdentifier);

    console.log(`[info]: posted to tumblr - ${me.blog.title}`);
  } catch (e) {
    console.error("[ERROR] tumblr:\n", e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function twitter(client: TwitterApiReadWrite, blogpost: any) {
  try {
    const formattedPost = `${blogpost.title}\n\n${blogpost.url}`;

    await client.v2.tweet({
      text: formattedPost,
    });

    const me = await client.currentUser();

    console.log(`[info]: posted to twitter - ${me.screen_name}`);
  } catch (e) {
    console.error("[ERROR] twitter:\n", e);
  }
}
