# DEVELOPERS MUST READ

**IMPORTANT: Before making any changes to this repository, you MUST read and follow these instructions.**

## 1. Local Commitment Message Protocol
- Every developer (human or AI) is required to update `/docs/LOCAL_COMMITMENT_MESSAGE.md` for every meaningful change, feature, or fix.
- **You MUST use the script** `node scripts/update_commitment_message.js "Your message here"` to append a timestamped entry describing your change.
- This script makes it easy and consistent to log your work. It automatically adds a timestamp and appends your message to the commitment file.
- If you do not use this script, your work may be considered invalid or incomplete.
- This ensures a transparent, session-based log of all work and decisions, separate from commit history.

## 2. Read This Before README
- This file contains mandatory process rules for all contributors.
- You must read and follow these instructions before reading or acting on the main `README.md`.

## 3. Consistency & Accountability
- The local commitment message is the source of truth for session progress and context.
- If you do not update it, your work may be considered invalid or incomplete.
- This applies to all contributors, including automated agents and AI assistants.


## 5. Professional File Architecture
- The repository uses a `legacy/` folder for deprecated or unused files. Move any outdated scripts, contracts, or tests there to keep the main tree clean.
- Blank files or folders created for architecture planning will contain a `BLANK_FILE_MARKER.txt` to indicate their purpose. Do not remove this marker unless the file/folder is populated with real content.
- Always keep the file structure organized and professional. Rename files for clarity and consistency as needed.

## 6. Questions or Issues
If you are unsure about the process, ask in the commitment message or contact the repository owner.

---
**By contributing, you agree to follow this protocol.**
