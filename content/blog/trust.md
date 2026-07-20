---
title: Trust
date: '2026-07-13T10:30:00.000Z'
tags:
  - open source
  - ai
description: "I want to talk about the biggest problem I've seen with AI: trust. It's not just that you can't trust the output of an LLM, it's that you can't trust people who use them."
---

I want to talk about the biggest problem I've seen with AI: trust.

## Models of the world

Each of us has a mental model of the world we live in.

Some things stay the same. Some things change. Some people like the change; some don't. But even when things change, there's a core that doesn't. When you wake up in the morning, you don't have to rebuild your worldview from scratch.

The most resilient people are able to revise their mental model to meet changing realities. But there are parts of your mental model that don't need to be revised. They are accurate _and remain so_.

Over time, we build up confidence that these parts of our models match reality. And something amazing happens. We start to be able to _simulate_ the world around us.

I think this is where trust comes from too. We know there are certain people who have our back. Or who will do what they say they will do. And we know there are people who are unreliable. Or who actively make our life worse.

Being able to model not just our world, but the people we live among, is essential.

## How LLMs break trust in our mental models

Non-deterministic behaviour messes with our minds, particularly when it masquerades as determinism.

This was true of many people's early experience with agents. Depending on small differences in a prompt (or, for all I could tell, the outdoor humidity) an agent might produce incredible work &ndash; or awful garbage.

Predictably, people responded irrationally. You might have seen this as either unconditional antipathy (people dismissing LLMs as incapable of generating valid code) or unconditional approval (people merging an LLM PR without review).

I think both are a category mistake. LLMs aren't entities you can trust. Lacking persistence, you're not even relating to the 'same' model each time you spin up your agent. Not to mention that skills, context, memory and more can change things further. What works one day might not work the next.

I'm well aware this is changing.

In the last year, huge effort has gone into improving agent harnesses and reducing the non-determinism of model output. Today, running a vanilla frontier model on a simple one-line prompt produces a genuinely good output more often than not.

In my opinion, however, _trust_ remains a fundamentally wrong attitude to have towards this kind of process, any more than you _trust_ the constant explosions of an internal combustion engine. To the extent you use it, you have to surround it and yourself with safety controls and systems that guard, direct and control the output.

**This is why I'm an AI skeptic**. And, in fact, I think everyone's fundamental posture should be one of skepticism, whether or not they use AI tooling.

## Living with skepticism

Skepticism is normal and healthy when dealing with untrusted input.

If you collaborate with other people, you'll know how important it is to build an immune system. Your immune system probably includes PR review, it might include custom lint rules, required CI/CD checks, and so on.

This prevents mistakes from entering your codebase. And it's necessary because you don't trust everyone blindly. (In all honesty, I don't even trust myself in this way, given the number of bugs I've caught in my own CI!)

Agent harnesses often include a basic kind of immune system. They might validate some commands before execution, or restrict certain activities. That's valid but far too limited.

> As an aside, I think this is the wrong level to apply restriction. Agents should probably be running in a sandbox (either remote or in a container), and in my opinion should not have 'write' permissions as you on GitHub. Do check out [workmux](https://workmux.raine.dev/), which has first-class support for local sandboxes with a network allow-list.

We should be _rigorous_ in our application of restrictions on agents. Even if you have a 99% success rate with your agents, you should think about and protect against the potential catastrophic failure.

Apart from preventing the agent from acting as you, I believe you should scrutinise code produced by an agent rigorously before committing it, or even opening a PR.

Here's a thought experiment. Imagine that your own reputation is infinitely precious to you. And imagine no one will believe that you use agents.

In this scenario, you _might_ use agents, but you'd scrutinise their output carefully. You'd be aware that your career and reputation are on the line. You wouldn't ever send an agent to open a PR on your behalf. You'd always review it first, make sure you understand it, and make sure it meets your own standards.

I actually think this is a healthy approach.

When LLMs first started being used, I thought that AI use should be clearly demarcated. Commits should bear a 'Co-authored-by' comment indicating the agent used. PRs should have a little disclaimer indicating the harness or prompt.

I no longer think this is helpful, any more than we should disclose the linter or editor we've used.

Why? Because responsibility should live with the person with moral agency. You.

Or put another way, reputational damage from poor PRs should live with the person who opened the PR.

## How LLMs break trust in people

The most insidious way that LLMs break trust is because **other people use them**.

That on its own isn't sufficient to break things down. No, it's that other people **trust** them.

Trust is a web. It's a graph. If I trust someone who has always been very reliable, until one day they _misplace_ their trust, then they become untrustworthy. And to an extent, so do I.

For example, consider a great coder that I trust. Then they fall prey to 'AI psychosis' (let's just define that for the moment as unconditional trust in and overuse of AI output). Now, I can't trust their work any more. What they do becomes unpredictable. One day they might open a PR they haven't reviewed. It might be good or bad. In this case, they become no more trustworthy than their harness.

Let me give you a couple of examples that happened to me in the last few months.

- Person A, someone I trust to maintain a project with me, closes a release PR with a brief note, and opens a new one. It looks perfect, but on closer inspection it won't work as it bypasses some automation I set up for releases. I made a comment and closed the PR and get this response: "My agent was a bit too eager to release 🥴"

   We quickly synced and resolved the issue &ndash; a genuine mistake &ndash; and we're all good.

- Person B, someone I also hugely trust and look up to, mentions he plans to do some work. Later that day, he opens a PR. The tests are all passing, and I get an automatic review request. I thank him via Discord and he tells me not to merge it; he hasn't reviewed it; it was opened by an LLM. Fast-forward a month and we end up closing it. It was the wrong approach.

- Person C, me, tries out a new coding assistant. I selected a GitHub issue, it asks me whether I want line-by-line prompts or whether it should just go ahead and resolve the issue all the way. I throw caution to the winds &ndash; I'm testing this, after all &ndash; and let it go. An hour later I'm mortified to see a slop PR open in `nuxt` itself, marked ready to review. It's total rubbish. And all in my name.

In each case, normally reliable people are _appearing_ to act. And in each case, my trust in that person is totally misplaced, because they were not meaningfully in-the-loop.

It's a totally untenable position.

Colleagues are opening huge slop PRs they haven't reviewed. It's on us to evaluate _from zero_. Open source contributors and claws are using LLMs to create drive-by PRs, only responding to maintainer suggestions with LLM-generated comments and changes. Reviewing a PR becomes a slow, awkward conversation with Claude &ndash; totally devoid of humanity.

The worst casualty in all of this is _trust_ &ndash; with the corresponding impact on our own mental health.

The paradox is, I don't blame someone for using an agent. But when I know they do, I trust them less.

After all, I can't tell whether they review their LLM-generated code. I don't know if they are in the grip of AI psychosis, or are using agents responsibly. I don't know if their PR description was even _read_ by them. In fact, I don't know if the PR was even intentional at all &ndash; or just a side-effect from an instruction to find the source of a bug (true story!).

This is poison for community and collaboration, because it destroys the basis of trust. I don't know whether the _person_ I trust is even the _agent_ who is acting.

This isn't the end of the story. Gradually, as I see they use their harness responsibly, trust can be rebuilt. But it takes time and shared consensus about what is acceptable behaviour.

This is a time of transition.

Companies that embrace slop are facing incredible blows to morale that will gut their teams and destroy their culture even as 'productivity' appears to increase. It might take a while for those chickens to come home to roost.

Open source contributors are learning what's acceptable. Tools like [AgentScan](https://agentscan.tools/) and [Anti Slop](https://github.com/peakoss/anti-slop), alongside initiatives from [GitHub](https://github.blog/open-source/maintainers/how-pull-request-limits-are-cutting-down-the-noise/) and [Tangled](https://blog.tangled.org/vouching/), are the beginnings of a new open source immune system. In time people will learn what good code contribution looks like, just as it takes time for people to understand the importance of a minimal reproduction.

We're getting there.

But it's going to take time to rebuild trust.
