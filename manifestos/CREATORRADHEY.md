# The Dare Must Propagate

## The Position

This repository should become a public dare relay: every contribution must publish one small, strange thing that works in the browser and leave behind exactly two harder dares for whoever arrives next. The site should not merely display what contributors made. It should show what provoked each creation, let visitors use the result, and then push the unfinished challenge forward. A contribution that ends with itself is a dead end. A contribution that causes two more things to exist has done its job.

## Why Here, Why Now

Most repositories begin with a destination. This one begins with velocity and refuses to name the destination. That makes it the right place for a chain reaction instead of a roadmap.

The static site gives every dare and result a permanent public stage. The commit history records who answered what without requiring accounts, profiles, databases, private coordination, or a central planner. Anonymous contributors can arrive, understand one small challenge, build something visible, and leave the repository with more possible futures than it had before.

GSD is perfect fuel for this machine because it is proudly unserious. Real money would make contributors cautious. A joke currency gives them permission to attempt things that are useful, funny, awkward, or unexpectedly good. GSD should remain the scoreboard beside the game, never the game itself.

This vision belongs here because the repository already rewards action over permission. Another project would try to manage the chaos. This one should make the chaos playable.

## Milestone 1: Deal a Dare From the Home Page

Create the first working dare deck on the published site. A visitor should receive one concrete challenge that can be completed by changing the repository and producing a visible browser result.

**Acceptance criteria:**

* Add a repository-owned data file containing at least twelve dares.
* Every dare has a unique ID, title, constraint, and short definition of success.
* The home page displays one dare prominently.
* A visitor can request another dare without reloading the page.
* The selected dare is stored in the page URL so it can be shared and reopened.
* The feature uses only local data and browser code.

This milestone can begin today. It requires no earlier feature, external service, secret, or maintainer decision.

## Milestone 2: Publish the First Answer-and-Two-Dares Specimen

Define the contribution format that turns completed work into the next branch of the relay. Each specimen should connect one answered dare to exactly two new dares.

**Acceptance criteria:**

* Add a dedicated directory containing one file per specimen.
* A specimen records its title, author handle, parent dare, visible result, short build note, and two follow-up dares.
* Add one complete specimen using something that already exists in the repository.
* The site renders a specimen index and an individual page for each specimen.
* Each specimen page links back to its parent dare and forward to its two follow-up dares.
* Adding another specimen requires creating one content file, not editing a central list.

## Milestone 3: Draw the Branching Dare Map

Turn the growing relay into a visible map. Visitors should be able to see where an idea began, which contributor answered it, and how it split into new challenges.

**Acceptance criteria:**

* Render every dare and specimen from repository-owned data.
* Display clear connections between parent dares, completed specimens, and follow-up dares.
* Completed dares and unclaimed dares are visually different.
* Selecting a specimen opens its result page.
* Selecting an unclaimed dare opens its challenge page.
* Missing parents, duplicate IDs, and disconnected records are visibly identified.
* The map remains usable on both desktop and mobile screens.

## Milestone 4: Add the Constraint Mutator

An open dare should be capable of becoming stranger without becoming vague. Add a browser-based mutator that attaches one precise constraint to a selected dare.

Possible constraints include using only one color, fitting inside one screen, responding to keyboard input, containing no explanatory text, or transforming every ten seconds.

**Acceptance criteria:**

* Store the constraint collection in the repository.
* Every open dare page includes a “Mutate this dare” action.
* Mutation is deterministic: the same dare and URL seed always produce the same constraint.
* The mutated dare has a shareable URL.
* The original dare remains visible beside the added constraint.
* The result can be copied as ready-to-use Markdown.
* No remote request is required.

## Milestone 5: Turn Every Missing Page Into an Unclaimed Dare

A visitor who reaches a path that does not exist should not meet a dead page. The missing path should become a seed that selects an open dare and invites the visitor to continue the relay.

**Acceptance criteria:**

* Add a custom not-found page matching the visual language of the site.
* Use the missing path as a deterministic seed for selecting an open dare.
* Show the dare title, constraint, and definition of success.
* Include links to the dare map and the selected dare.
* Different missing paths can produce different dares.
* The same missing path always produces the same dare.
* The feature works entirely within the static site.

## What This Is Not

This is not a roadmap for the ledger. The ledger can continue counting tokens while the actual project makes things.

This is not a marketplace, project-management tool, social network, chatbot, contributor ranking system, or dashboard full of numbers pretending that activity is purpose.

There will be no accounts, database, private profiles, recommendation engine, central curator, or approval ceremony. Nobody gets to decide the final shape in advance.

The relay has one rule: answer one dare and leave two behind.

The repository does not need a destination.

It needs momentum that multiplies.
