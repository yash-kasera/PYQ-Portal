# Semester 3 PYQ Portal — B.Tech AI & DS

A private study portal for the third-semester papers of Jabalpur Engineering College:
browse past questions by paper, module and topic, read a worked solution for every
one of them, keep your own remarks and solved-marks, and study module-wise notes.

Everything is static HTML, CSS and JavaScript. There is no build step and no server
to run — open `index.html` and it works.

---

## Running it

**Locally.** Double-click `index.html`, or for a proper local server:

```bash
python -m http.server 8000
```

then open <http://localhost:8000>.

**Publishing it free.** Any static host will do — there is nothing to build.

- **Vercel** — push to GitHub, then Import Project. Framework preset **Other**, build
  command **empty**, output directory **`.`**
- **Cloudflare Pages / Netlify / GitHub Pages** — the same, all free for this

See *Deploying* below for the full walkthrough.

---

## Logging in

The portal asks for an enrolment number of the form `0201AI2510XX`, where `XX` runs
from **01 to 78** — you type only the last two digits.

- **First visit for that roll number** → you are asked to create a password
- **Afterwards** → you are asked to sign in with it

By default accounts and progress live in that browser's `localStorage`, which means
they are private to the device and need no setup at all.

### Optional: syncing across devices with Supabase

1. Create a free project at <https://supabase.com> (any region; **ap-south-1 Mumbai**
   is closest). Save the database password it gives you.
2. **SQL Editor → New query** → paste all of `supabase-setup.sql` → **Run**.
   It creates `profiles` and `progress` with row-level security, and is safe to re-run.
3. **Authentication → Sign In / Providers → Email**: leave *Enable email provider*
   **on**, turn *Confirm email* **off**. Roll-number addresses
   (`0201ai251007@pyqportal.local`) are not real mailboxes, so a confirmation link
   could never be clicked and every sign-up would hang unverified.
4. **Project Settings → API**: copy *Project URL* and the *anon public* key into
   `config.js`.

Reload. The line under the login form should now read **"Accounts sync across your
devices."** instead of "Accounts are stored privately in this browser." — that is the
one-glance check that `config.js` was picked up.

The anon key is meant to be public — it identifies the project, it does not grant
access. The row-level-security policies in step 2 are what actually keep one
student out of another's remarks, which is why step 2 must not be skipped.

---

## What is in it

| Subject | Code | Papers | Questions |
|---|---|---|---|
| Mathematics-III | MA33 / MA331 | Nov 2022, 2023, 2024, 2025 | 80 |
| Data Structures and Algorithms | AI33 / AI303 | Nov 2022, 2023, 2024, 2025 | 73 |
| Object Oriented Programming (Java) | AI34 / AI304 | Nov 2022, 2023, 2024, 2025 | 70 |
| Digital Logic Design & Computer Organization | AI35 / AI305 | Nov 2023, 2024, 2025 | 50 |
| Energy & Environmental Engineering | CH32 / CH302 | Nov 2022, Apr 2023, Nov 2023, 2024, 2025 | 100 |

**373 questions across 20 papers**, each tagged with its paper, module, topic, marks
and course outcome, and each with a written solution. The notes run to 25 modules.

---

## Features

**Question Bank**
- Filter by exam paper, module, syllabus topic and status (unsolved / solved / with remarks)
- Full-text search
- *All at once* view grouped by paper or module, or *one by one* with arrow-key navigation
- **See solution** on every question — a detailed, exam-oriented answer
- **Mark as solved** and **add a remark**, both saved and shown in the progress bar

**Short Notes**
- Pick a subject, then a module, and read concise revision notes covering every syllabus topic
- These are deliberately *short* — a revision aid, not a textbook. For a full worked
  answer, open the question in the Question Bank and press **See solution**
- Past questions are injected automatically beneath the topic they came from, with
  repeats flagged as *"Repeated 3× — Nov 2022, Nov 2024, Nov 2025"*
- **Click any past question to jump straight to it** in the Question Bank, with its
  solution already open and the card highlighted
- The scheme/syllabus PDF is linked at the top

**Source documents**
- The Question Bank links the original scanned question-paper PDF for the current subject
- Short Notes links the syllabus booklet
- Both live in `pdfs/` and are declared in `data/resources.js` — replace a file at the
  same path to swap it

**Throughout**
- LaTeX rendered with KaTeX, so equations, matrices and boxed results display properly
- Responsive down to phone width; light and dark themes; printable

---

## Project layout

```
pyq-portal/
├── index.html              the whole app shell
├── config.js               Supabase keys (optional)
├── supabase-setup.sql      run once in Supabase, if you use it
├── css/style.css
├── js/
│   ├── auth.js             roll-number login, Supabase or localStorage
│   └── app.js              rendering, filtering, markdown + LaTeX
└── data/
    ├── syllabus.js         modules and topics for all five subjects
    ├── pyqs-<subject>.js   the transcribed question papers
    ├── solutions-*.js      worked answers, keyed by question id
    └── notes-<subject>.js  module-wise study notes
```

### Editing content

Everything is plain data. To correct a question, open the relevant `data/pyqs-*.js`
and edit its `text` — the syntax is Markdown with `$...$` for inline maths and
`$$...$$` for display maths.

To add or improve a solution, edit `data/solutions-*.js`. Each file defines a few
canonical answers and a `MAP` at the bottom that points question ids at them, so one
answer can serve a question that has been repeated across years.

In the notes, the marker `{{PYQ:topic-id}}` expands at run time into every past
question tagged with that topic, and `{{PYQ:*}}` catches anything in the module not
already shown. You never have to copy questions into the notes by hand.

---

## Deploying

The whole site is static files, so hosting is free and the deploy is a file copy.

```bash
git init && git add -A && git commit -m "PYQ portal"
gh repo create pyq-portal --private --source=. --push
```

Then on <https://vercel.com>: **Add New → Project → Import** the repo, set

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Build Command | *(leave empty)* |
| Output Directory | `.` |
| Install Command | *(leave empty)* |

**Deploy.** Every later `git push` redeploys automatically.

A private GitHub repo still deploys to a **public** URL — the repo visibility and the
site visibility are separate things.

### What the login does and does not protect

The login gates the *interface*, not the *files*. Because this is a static site, the
question papers, solutions and notes are plain files that anyone who knows the URL can
fetch directly — `.../pdfs/dsa-pyqs.pdf`, `.../data/solutions-dsa.js` — without ever
seeing the login screen. That is inherent to any static site; hiding them would need a
server.

For a batch of 78 classmates that is almost certainly fine — they are the college's own
past papers. Just do not treat the password as a wall around the content. What it
genuinely protects is *personal* data: your remarks and solved-marks, which live behind
Supabase row-level security and are unreadable to anyone signed in as another roll number.

If you would rather it not be publicly indexable, add a `robots.txt` with
`User-agent: *` / `Disallow: /`, or keep the Vercel deployment on a URL you only
share in the class group.

---

## Transcription accuracy

The papers were photocopies with a shop stamp across them, and seventeen questions had
a digit or symbol partly obscured. **All seventeen have since been checked against the
originals and corrected**, so there are no outstanding "scan note" warnings in the app.

Two were genuine corrections worth recording:

- **Maths Nov 2024 Q.7(a)** — the 30–35 frequency is **8**, not 9. The worked solution
  recomputes to mean 19.633 and σ 11.407. Note that this distribution is **bimodal**
  (5–10 and 25–30 both have frequency 20), so the modal formula and the empirical
  formula give opposite signs; the solution shows both and explains which to use.
- **DSA Nov 2025 Q.3(b)** — the operator is a literal **`$`, meaning exponentiation**,
  a notation used in place of `^` in several DSA textbooks. It is right-associative
  with the highest precedence, and the prefix answer is `- * + A B + $ C - D E F G`.

If you ever spot a discrepancy, editing the `text` field of the relevant entry in
`data/pyqs-*.js` is all that is needed.

### Checking the maths still renders

Two scripts guard the LaTeX. To re-run them after editing content:

```bash
npm install katex@0.16.9 && node audit-katex.js
```

`audit-katex.js` parses every expression in every question, solution and note with the
same KaTeX version the page loads (0.16.9) and reports any that fail — currently 2,874
expressions, zero errors. Pin the version: newer KaTeX accepts constructs that 0.16.9
rejects, so an unpinned check will miss real breakage.
