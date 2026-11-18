# Planning Poker

A real-time planning poker app where teams estimate how many hours their tasks will take, each in its own Room.

## Language

### People

**Participant**:
Anyone currently in a Room, identified by a display name they chose, unique within that Room.
_Avoid_: User, player, member

**Facilitator**:
The one Participant who runs the Room: the only one who can Reveal, start a new Round and change the Deck.
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
The moment the Facilitator turns every Vote face-up at once, ending voting for the Round.
_Avoid_: Flip, show

**Result**:
The mean of the Votes cast in a Round, revealed with them. Voters who did not vote do not count.
_Avoid_: Final estimate, average, score

**Estimate**:
A duration in hours. It is the unit of every Card and of every Result.
_Avoid_: Points, story points, effort

### Fun

**Reaction**:
An emoji a Voter sends up from their own Card, seen by everyone for a moment. It changes nothing in the Round.
_Avoid_: Emote, sticker

**Throw**:
Something silly a Participant tosses at another Voter's Card (a paper ball, a tomato, flowers), seen by everyone for a moment. It changes nothing in the Round.
_Avoid_: Mock, attack, poke
