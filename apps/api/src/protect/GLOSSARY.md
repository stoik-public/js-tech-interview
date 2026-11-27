# Stoïk Protect Lite

The security team uses Stoïk Protect Lite to score the security of client companies every month, and to send each one a report with its security score.

## Language

### People

**Company**:
A client of Stoïk Protect, whose security is scored every month. Not the company of the insurance test: each test has its own.
_Avoid_: Customer, account, tenant

**Squad**:
The team that owns one signal: Human Security, Technical Risk or Managed Defense.

### Signals

**Signal**:
A measure of one weakness of a company, owned by a squad. Signals are whole numbers. There are three.
_Avoid_: Metric, indicator, KPI

**Phishing click rate**:
The percentage of employees who clicked the last fake phishing email. Owned by Human Security.

**Leaked passwords**:
The company passwords found leaked online. Owned by Technical Risk.
_Avoid_: Breached credentials

**Unhandled alerts**:
The security alerts left unhandled for more than a week. Owned by Managed Defense.

### Scoring

**Security score**:
A number out of 100: 100 minus one penalty per signal. A higher score is better.
_Avoid_: Rating, grade, risk score

**Scoring rules**:
The penalty tiers of each signal and the security levels. The security team owns them. They change data, never the formula.
_Avoid_: Scoring model, grid

**Penalty tier**:
"Up to this value, take this many points off". The first tier whose upper bound includes the signal gives its penalty. The last tier of a signal may have no upper bound.

**Penalty**:
The points a signal takes off 100.
_Avoid_: Malus, deduction

**Security level**:
The label of a range of scores: Critical, Weak or Good. The security levels in force are listed in the security level legend.
_Avoid_: Band, grade, rating, risk level

**Score breakdown**:
One line per signal, with its value, its tier and its penalty. The lines add up to the score.

### Reports

**Report**:
A company's security score for one month: its signals, its score, its security level and its breakdown. A report is either draft or published. A company has one draft report at most.
_Avoid_: Assessment, audit, evaluation, scan, snapshot

**Draft report**:
A report the security team can still change. It is re-scored whenever a signal changes.

**Publish**:
The action that freezes a draft report. A published report is never re-scored.
_Avoid_: Send, finalize, lock

**Published report**:
What the client received that month. It never changes.
_Avoid_: Statement
