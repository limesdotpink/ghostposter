# ghostposter

Ingest a Ghost webhook and post to the major social media platforms.
Currently supports Bluesky, Mastodon, and Tumblr. Twitter is provided as-is, and may need testing.

![ghostposter_hero](https://github.com/user-attachments/assets/fde979e0-ade9-4fbb-a34f-e2a90c9c1c07)

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

P.S: If you're running this with docker compose, you must give the container a hostname (e.g. ghostposter.local), or Ghost will refuse to send a webhook to the container. If you configured this the same way as the `docker-compose.yml` in this repo, the webhook ingest url
will be `http://ghostposter.local:3000/hook`.

### Bluesky
For the password, generate an App Password.

### Mastodon
Create an application with the `profile` and `write:statuses` scopes. Leave the default callback url.

### Tumblr
[Register an application](https://www.tumblr.com/oauth/register), then go to https://www.tumblr.com/oauth/apps and input the OAuth Consumer Key and OAuth Consumer Secret from your newly created app. Authorize, then grab the token and token secret from the page you land on.

### Twitter
You're on your own here.

<br>
<br>
<p align="right">made with ❤ by <a href="https://limes.pink" target="_blank">limes.pink</a></p>
