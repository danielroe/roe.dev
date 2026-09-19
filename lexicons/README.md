# lexicons

Vendored copies of the upstream schemas the CMS references. My own `dev.roe.*`
schemas are not here: they are written in TypeScript in [`../lexicons.ts`](../lexicons.ts)
with [airspace](https://getair.space), which derives the record types, the
collection clients and the OAuth scopes from the same definitions.

The files under `community/` are verbatim copies of
[Lexicon Community](https://tangled.org/lexicon.community/lexicons) schemas,
checked against the `com.atproto.lexicon.schema` records published at
`did:plc:mtr7qrqtcyseedx3jyr5o7db`:

- `community.lexicon.app.defs` — `#link`, `#image`, `#status` and `#aspectRatio`,
  used by `dev.roe.project`, `dev.roe.usesItem`, `dev.roe.talk` and
  `dev.roe.ama` instead of home-grown equivalents.
- `community.lexicon.location.address` — the body of `dev.roe.location`.

The files under `site/standard/` are copies of the
[standard.site](https://standard.site) schemas published at
`did:plc:re3ebnp5v7ffagz6rb6xfei4`. `shared/standard-site.ts` turns
`site.standard.publication` and `site.standard.document` into collections, which
the build-time sync writes to. `com/atproto/label/defs.json` is here because
both of them reference `#selfLabels`.

Refresh them from upstream when the shared defs change.

- `pnpm lex:gen` regenerates the TypeScript in `shared/lex/` from these files.
  `lexicons.ts` references the output directly (`l.ref(() => appDefs.image)`).
- `pnpm lex:publish` writes each `dev.roe.*` schema to the PDS as a
  `com.atproto.lexicon.schema` record, reading them from `lexicons.ts`. Schemas
  outside the `dev.roe` authority are never republished under my DID. It reads
  `NUXT_ATPROTO_PASSWORD` from `.env`; the DID and PDS endpoint are resolved
  from the handle. Add `--dry-run` to see the plan without credentials.

Third-party resolution also needs a DNS TXT record for the `dev.roe` authority
(reverse the NSID minus its final segment):

```
_lexicon.roe.dev  TXT  "did=<did of the repo the schemas were published to>"
```

`pnpm lex:publish` prints the exact value to use.

Resolution is not hierarchical, so any future authority (e.g. `dev.roe.cms`)
needs its own `_lexicon.cms.roe.dev` record.

See [Lexicon publication and resolution](https://atproto.com/specs/lexicon#lexicon-publication-and-resolution).
