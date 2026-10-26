# Rapid Reach audit proxy

The closing deck needs live Google results to build the prospect audit.
Calling serper.dev straight from the browser would mean shipping the API
key to every viewer and committing it to a public repo. This sits in
between instead.

## Setup

1. Netlify, Add new site, Import an existing project, pick this repo.
2. Deploy it. The defaults in `netlify.toml` are already correct.
3. Site configuration, Environment variables, Add a variable:
   - Key:   `SERPER_KEY`
   - Value: the Serper API key
4. Deploys, Trigger deploy, so the function picks up the variable.

The deck calls `/.netlify/functions/serper` with `{endpoint, body}` and
gets Serper's JSON straight back.

Only `https://grantenyeart.github.io` may call it, so a leaked URL on its
own cannot spend credits.

To rotate the key, change the environment variable and redeploy. Nothing
in the deck needs touching.
