# Nobot

> RIP: [the web game will end on the 22th February 2021 😭](https://twitter.com/oda_nobunyaga/), so I'm stopping the development from now on.

The goal is to rewrite [nobot-backend](https://github.com/Ucandoit/nobot-backend) in Node.js and manage it with docker/docker-compose.

## How it works

The bot relies on providing the access token of the user account, and then it simulates user actions (click, drag&drop, etc.) by sending appropriate requests. It can also parse the responses (in plain html) to analyse game data and stores them for further usages.

The access token can be retrieved by browser's dev tool. It lasts for a month on PC version of the game and 10 years on mobile version 😂, that's how the bot is abled to work.

## Features

The bot provides API for almost everything that we can do in the web game.

The main features are:

* Automation: it's the most important goal and reason to develop this bot, it helps to do many repetitive things automatically such as:
  * pass the initial tutorial
  * do daily quests
  * participate monthly events
* Visualization: since it stores all game data (cards, skills, etc.), it can also provide game informations in a personalized way. It can also display multiple accounts' data at the same time, which is not possible with the game UI interface.
