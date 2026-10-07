+++
title = "Terminal precision"
description = "Nine scenarios, four libraries, N from 1 to 10,000, every cell against 200-digit arithmetic and checkable on Sepolia."
template = "demo.html"
+++

Each scenario is N identical steps run through each library in its native representation, against the same loop in exact arithmetic. The table is the argument: read down a column and watch the green prefix shrink. The chart is the summary. Every cell has a button that runs it again on Sepolia through the deployed [`LadderRunner`](/contracts/deployments/Ladder.md) and compares the raw word with the committed one.
