# Drive Folder Architecture

## Purpose

Corion must never spray operational files into the root of a human Google Drive account.
That creates clutter, destroys retrieval quality, and makes the system feel unsafe and disorganized.

This document defines the required Drive architecture for all future agent and workflow actions.

## Core rule

All operational files must be written into a canonical folder structure.

Agents must not upload workflow media, Telegram intake screenshots, order photos, temporary JSON files, or calendar-related supporting files into Drive root.

Root-level uploads are considered a workflow bug.

## Canonical top-level structure

Within Google Drive, Corion should use a stable top-level structure such as:

- `00_CORION_LACKDOKTOR/`
  - `01_TEMPLATES/`
  - `02_AUFTRAEGE_ACTIVE/`
  - `03_ARCHIV_COMPLETED/`

For the current operational spine, the critical folder is:
- `00_CORION_LACKDOKTOR/02_AUFTRAEGE_ACTIVE/`

## Per-order structure

Each Auftrag should receive a dedicated folder inside `02_AUFTRAEGE_ACTIVE/`.

Recommended naming:
- `[YYYYMMDD]_[KENNZEICHEN]_[KUNDENTAG]/`

Examples:
- `[20260527]_[HUST1512]_[Kubala]/`
- `[20260523]_[MTKS1133]_[Hampel]/`
- `[20260527]_[UNBEKANNT]_[Lars]/`

Inside each order folder, create a stable subfolder structure:
- `01_Documente_Client/`
- `02_Media_Daune/`
- `03_Expertiza_Tehnica/`
- `04_Comunicare_Asigurare/`
- `05_Termin_und_Kommunikation/` (recommended addition)
- `06_Intern/` (recommended addition)

## File routing rules

### Damage photos
Store in:
- `02_Media_Daune/`

### Intake forms, cards, registration images, insurance letters
Store in:
- `01_Documente_Client/`

### Expert or technical references, measurements, PDR/reflection images, calculations
Store in:
- `03_Expertiza_Tehnica/`

### Insurance communication, claim letters, approvals, insurer screenshots
Store in:
- `04_Comunicare_Asigurare/`

### Appointment screenshots, booking confirmations, WhatsApp scheduling screenshots
Store in:
- `05_Termin_und_Kommunikation/`

### Internal notes, temporary working material, machine-generated helper artifacts
Store in:
- `06_Intern/`

## Workflow contract

Every workflow that uploads a file must know one of these before upload starts:
- the target order folder id
- the target order folder URL
- the target canonical subfolder id
- or, if the order does not exist yet, it must first create or resolve the order folder

Upload-first-then-organize-later is not acceptable as a default workflow.

## Agent rules

Agents must follow these rules:
- never upload operational media into Drive root when an Auftrag exists or can be created first
- prefer canonical subfolders over flat order-folder dumps
- attach uploaded files to calendar events only after they are already placed in the correct folder
- keep naming human-readable and case-oriented
- preserve access simplicity for humans opening Drive manually

## Human access principle

The Drive structure should feel obvious to a non-technical human.
A person opening Drive should be able to infer:
- which customer or plate the folder belongs to
- where damage photos live
- where scheduling screenshots live
- where insurance documents live
- where internal notes live

This matters because Drive is not only machine storage.
It is also a human operations surface.

## Immediate correction rule

When a file is discovered in Drive root but clearly belongs to an Auftrag workflow, the system should treat that as a misrouted file and correct the routing in the next maintenance pass.

## Relationship to agent constitution

This folder architecture is not just a convenience.
It is an operational safety rule.

Agents that create or move files must respect canonical storage boundaries just as they respect canonical order, task, finance, and communication spines.

## Implementation direction

Short term:
- extend `drive_upload` so callers can specify folder URL or folder id reliably
- ensure all Telegram/agent media uploads use canonical order subfolders
- stop producing root-level Drive clutter immediately

Medium term:
- add explicit folder-routing helpers by document/media type
- add cleanup tooling for previously misrouted files
- add file-routing metadata into workflow logs and order spine
