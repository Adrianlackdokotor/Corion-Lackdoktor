# Junk Preservation Policy

## Purpose

Corion currently contains many experimental, patch, migration, probe, and partial workflow files. Some may still contain useful logic. To reduce breakage risk, we preserve first and delete later.

## Rule

Do not hard-delete uncertain code during the current stabilization phase.

If a file is:
- ad-hoc
- duplicate-looking
- old but possibly useful
- partially working
- superseded but not yet fully understood

then move it into a clearly named preservation zone rather than deleting it.

## Approved preservation zones

Recommended directories:
- `Junk/patches/`
- `Junk/probes/`
- `Junk/legacy-ui/`
- `Junk/legacy-routes/`
- `Junk/scripts/`
- `Junk/assets/`
- `Junk/archive-notes/`

If we want a softer name later, `Archive/` or `Legacy/` can be introduced, but for now `Junk/` is acceptable as a quarantine zone.

## Move rules

When moving a file into `Junk/`:
1. Keep the original filename when possible.
2. Add a short README or index note in the target folder when a group of files is moved.
3. Note why the file was moved:
   - duplicate
   - legacy flow
   - one-off patch
   - experimental
   - replaced by canonical spine
4. If the file is still imported anywhere, do not move it yet.
5. If uncertain whether runtime still uses it, document first, move later.

## Delete rules

A file should only be deleted when all are true:
1. canonical replacement is live
2. runtime usage has been checked
3. no important logic remains unique to the old file
4. migration note exists in docs
5. deletion is reviewed intentionally, not done during random cleanup

## Agent rule

Agents must prefer:
- document
- isolate
- preserve
- rename carefully

over:
- delete quickly
- flatten context
- assume dead code without proof

## Immediate cleanup strategy

Near-term goal is not total cleanup. Near-term goal is safer organization.

Priority:
1. identify canonical files
2. identify mixed files
3. identify legacy files
4. quarantine reusable junk
5. only later remove truly dead code
