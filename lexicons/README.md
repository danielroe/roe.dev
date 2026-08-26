# lexicons

Schemas for the records my CMS writes to my PDS. `com/` and `community/` hold
vendored copies of upstream schemas we reference; everything under `dev/roe/` is
mine.

`community/lexicon/app/defs.json` is a verbatim copy of the
[Lexicon Community](https://tangled.org/lexicon.community/lexicons) schema,
checked against the `com.atproto.lexicon.schema` record published at
`did:plc:mtr7qrqtcyseedx3jyr5o7db`. `dev.roe.project` uses its `#link`,
`#image` and `#status` defs rather than reinventing them. Refresh it from
upstream when the shared defs change; `pnpm lex:publish` only writes `dev.roe.*`
schemas, so vendored files are never republished under my authority.

- `pnpm lex:gen` regenerates the TypeScript types in `shared/lex/`.
- `pnpm lex:publish` writes each `dev.roe.*` schema to the PDS as a
  `com.atproto.lexicon.schema` record, with the NSID as the record key. It needs
  only `NUXT_ATPROTO_PASSWORD`; the DID and PDS endpoint are resolved from DNS
  and the DID document.

Third-party resolution also needs a DNS TXT record for the `dev.roe` authority
(reverse the NSID minus its final segment):

```
_lexicon.roe.dev  TXT  "did=<did of the repo the schemas were published to>"
```

`pnpm lex:publish` prints the exact value to use.

Resolution is not hierarchical, so any future authority (e.g. `dev.roe.cms`)
needs its own `_lexicon.cms.roe.dev` record.

See [Lexicon publication and resolution](https://atproto.com/specs/lexicon#lexicon-publication-and-resolution).
