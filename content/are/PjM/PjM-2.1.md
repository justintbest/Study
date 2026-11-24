## What this objective tests
Can you turn the scope of services into a **work plan**, meaning tasks, sequence, durations, milestones, staff and fee, and then keep it current as the project changes? It's U/A: read a schedule, find the critical path, and decide what an update or delay means.

## Building the plan
1. **Start from the agreement:** the services, deliverables, phases and agreed milestones. B101-2017 asks the architect to submit a schedule of services for the owner's approval early in the project. That schedule includes time for owner reviews, the owner's consultants and agency approvals.
2. **Work breakdown structure (WBS):** phases → tasks → deliverables, with each one assigned to someone (internal staff or a consultant).
3. **Sequence and durations:** dependencies between tasks, and duration estimates from past projects and the staff available.
4. **Load resources and fee:** hours by task (see 1.2) must fit the fee.
5. **Baseline:** save the approved plan. Track progress against it. Don't overwrite it.

> [!VERIFY] B101-2017 §3.1.3 (schedule of services with owner-review and agency allowances) is from my knowledge of the 2017 edition. Confirm against your copy.

## Schedule formats
| Format | Good for | Weakness |
|---|---|---|
| Milestone list | Owner summaries | No durations or logic |
| Gantt (bar) chart | Seeing phase timing at a glance | Usually hides dependencies |
| CPM network | Finding the **critical path** and float | Harder for non-specialists to read |

## CPM essentials
- **Critical path:** the longest path through the network. It sets the shortest possible project duration. Any delay on it delays the finish.
- **Total float:** how long a task can slip without delaying the finish. It equals the latest start minus the earliest start. Critical tasks have zero float.
- **Relationships:**
  - Finish-to-start (FS): B starts when A ends.
  - Start-to-start (SS) with a lag: B starts some time after A starts.
  - Finish-to-finish (FF).
- **A delay beyond float:** the project slips by the delay minus the float.

## Compressing a schedule
- **Fast-tracking:** overlap work that normally runs in sequence, e.g. early site and foundation packages under a CMc. It saves the most time, but it risks redesign and changes.
- **Crashing:** add resources to critical tasks. It costs more, and returns diminish as you add people (see 1.2).
- **Never** compress by deleting owner reviews or agency review time you don't control.

## Maintaining the plan
- Update the plan regularly, at least at every milestone, with actual progress and a revised forecast.
- When an owner delay or a scope change moves milestones, update the schedule, show the effect and **notify the owner in writing**. If the delay stretches the architect's services past the agreed time, the extra time may be compensable under the agreement.

## Common exam traps
> [!TRAP] Choosing the path with the most tasks as critical. The critical path is the one with the longest **total duration**.

> [!TRAP] Assuming every delay delays the project. Subtract the task's float first.

> [!TRAP] Overwriting the baseline every time a date slips. You lose the record of what changed.
