# tower-defense

This is an online co-operative Tower Defense game.

The [blog is up][blog]!

[![Build Status](https://travis-ci.org/danielmoniz/tower-defense.svg?branch=master)](https://travis-ci.org/danielmoniz/tower-defense)


## Setup


Initially, set it up by running:

    npm install
    npm install -g gulp
    cd client
    gulp build

Run the tests with:

    npm test

Or, for continuous testing:

    npm run test:watch

Then run:

    npm run start-debug

Note that the server does not yet support auto-reloading, so you will have to restart it manually between changes. `CTRL-C` to stop; the re-run the command.

Use `gulp watch` to automatically update the build when changes are made. (the server must still be restarted)

Instead of `start-debug`, to have the server restart automatically when making server-side changes (client-side JS already does not need a server restart), run:

    npm run start-watch

This will also run the server in debug mode. Should not be used in production.

Then visit `localhost:3000/game` to play the game!

If your server (run with `npm run start-watch`) will not exit, run:

    lsof -n | grep LISTEN

And use the `kill` command to kill any node processes. Eg.

    kill 82335

[blog]: https://danielmoniz.github.io/tower-defense/
