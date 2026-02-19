# ghostposter

Ingest a Ghost webhook and post to the major social media platforms.
So far, this supports Bluesky, Twitter, Mastodon and Tumblr.

## Setup

Create a `config.json`, using the example file as reference.

Then, either
```
npm i
npm run build
npm start
```

or
```
docker compose up -d
```

### Bluesky
For the password, generate an App Password.

### Mastodon
Create an application with the `profile` and `write:statuses` scopes. Leave the default callback url.

### Tumblr
[Register an application](https://www.tumblr.com/oauth/register), then go to https://www.tumblr.com/oauth/apps and input the OAuth Consumer Key and OAuth Consumer Secret from your newly created app. Authorize, then grab the token and token secret from the page you land on.

### Twitter
You're on your own here.