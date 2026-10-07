+++
title = "Badges"
description = "An on-chain pixel identity for your address on Sepolia."
template = "badges.html"
+++

A badge is a small contract of your own, created through the badge factory, that holds a 32 by 32 pixel image for your address. Draw one in the editor or upload an image, and it shows next to your address wherever this site reads the chain. Connect a wallet on Sepolia to create or edit yours; without one you can still look up any address. Contracts: [`badge.vy`](https://github.com/securedataresearch/blockulator/blob/master/contracts/src/identity/badge.vy) and [`badge_factory.vy`](https://github.com/securedataresearch/blockulator/blob/master/contracts/src/identity/badge_factory.vy).
