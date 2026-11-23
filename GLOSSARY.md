# Planning Poker

A real-time planning poker app where teams estimate how many hours their tasks will take, each in its own Room.

## Language

### People

**Participant**:
Anyone currently in a Room, identified by a display name they chose, unique within that Room.
_Avoid_: User, player, member

**Facilitator**:
The one Participant who runs the Room: the only one who can Reveal, turn Auto Reveal on or off, start a new Round and change the Deck.
_Avoid_: Moderator, host, Scrum Master, admin

**Voter**:
A Participant whose Vote is expected in every Round.

**Observer**:
A Participant who watches the Room without voting, so the Room never waits on them.
_Avoid_: Spectator, viewer, guest

### Estimating

**Room**:
A shared space where one team estimates together, named by its Room ID. Each Room has its own Participants, Facilitator, Round and Deck.
_Avoid_: Session, table, lobby

**Room ID**:
The name of a Room, as it appears in its URL. Anyone who has it can join the Room.
_Avoid_: Room code, room name, room number

**Last Room**:
The Room a browser joined most recently, which opening the app with no Room ID goes back to. Leaving it means the browser has no last Room.
_Avoid_: Home Room, current Room, recent Room

**Share link**:
The URL of a Room, which a Participant copies to invite others.
_Avoid_: Invite, invitation link

**Leave**:
A Participant removing themselves from a Room at once, rather than waiting out a dropped connection.
_Avoid_: Logout, sign out, exit

**Table**:
The oval in the middle of the Room's screen, where each Voter's Card sits at their seat. A place on the screen, not another name for the Room.

**Hand**:
The row of the Deck's Cards below the Table, where a Voter plays their Vote. A place on the screen, like the Table.
_Avoid_: Deck (the set of Cards, not where they are shown)

**Round**:
One estimation of one task, from the first Vote until the next Round starts.
_Avoid_: Game, hand, iteration

**Deck**:
The set of Cards every Voter chooses from, the same for everyone in the Room. It starts as the default hours Deck and only the Facilitator can change it.

**Card**:
One value in the Deck that a Voter can play.

**Vote**:
The Card a Voter has played in the current Round, hidden from others until the Reveal.
_Avoid_: Bid, pick

**Reveal**:
The moment every Vote turns face-up at once, ending voting for the Round. The Facilitator Reveals, or Auto Reveal does it for them.
_Avoid_: Flip, show

**Auto Reveal**:
A Room setting under which the Round Reveals itself a few seconds after every Voter has voted, counting Voters who are away but still in the Room. A Voter joining in those seconds stops it, and it waits while the Room has no Facilitator. Rooms start with it on.
_Avoid_: Automatic reveal, instant reveal

**Result**:
The mean of the Votes cast in a Round, revealed with them. Voters who did not vote do not count.
_Avoid_: Final estimate, average, score

**Everyone agrees**:
A Round whose Votes are all the same Card.

**Nearly everyone agrees**:
A Round whose Votes differ, but only by one Card in the Deck: every Vote is next to the majority Card, or, with no majority Card and no Split, next to a Card someone played. Nobody is named.
_Avoid_: Almost consensus, close enough

**Outlier**:
A Voter whose Vote is two or more Cards away in the Deck from the majority Card: the one Card with more Votes than any other, holding at least half of them. After the Reveal the team asks Outliers why.
_Avoid_: Dissenter, odd one out

**Split**:
A Round whose Votes fall into two camps: two Cards that are not next to each other in the Deck tie for the most Votes, and every other Vote is next to one of them.

**No consensus**:
A Round whose Votes have no clear majority, are not a Split and are not all close together. Nobody is named; the team talks it through and votes again.
_Avoid_: Everyone disagrees

**Estimate**:
A duration in hours. It is the unit of every Card and of every Result.
_Avoid_: Points, story points, effort

### Fun

**Reaction**:
An emoji a Voter sends up from their own Card, or an Observer from their Ghost, seen by everyone for a moment. It changes nothing in the Round.
_Avoid_: Emote, sticker

**Throw**:
Something silly a Participant tosses at another Voter's Card or at someone else's Ghost (a paper ball, a tomato, flowers), seen by everyone for a moment. It changes nothing in the Round.
_Avoid_: Mock, attack, poke

**Ghost**:
A small character an Observer can choose to have and walk around the Table, seen by everyone with its owner's name. It is where that Observer is on the Table: their Reactions and Throws come from it, and others can Throw at it. It changes nothing in the Round. Having a Ghost is not a role: its owner is still an Observer, and only Observers have Ghosts.
_Avoid_: Avatar, sprite, pet; and "ghost" for a Participant who disconnected (they are away)

**Skin**:
How a Ghost looks: the fabric of its dress and its disguise, chosen by its owner. Two Ghosts may wear the same Skin.
_Avoid_: Costume, outfit, theme
