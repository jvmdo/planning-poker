# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Two more statuses mark the end of a ticket's life. No skill names them; `issue-tracker.md` says when to set each.

| Label in our tracker | Meaning                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| `needs-human-check`  | Built and committed; a box only the human can tick (a check by eye) is open |
| `closed`             | Every box ticked; nothing left to do                                        |

Edit the "Label in our tracker" column to match whatever vocabulary you actually use.
