# lexicons

Schemas for the records my CMS writes to my PDS. `com/` holds vendored copies of
upstream schemas we reference; everything under `dev/roe/` is mine.

- `pnpm lex:gen` regenerates the TypeScript types in `shared/lex/`.
- `pnpm lex:publish` writes each `dev.roe.*` schema to the PDS as a
  `com.atproto.lexicon.schema` record, with the NSID as the record key.

Third-party resolution also needs a DNS TXT record for the `dev.roe` authority
(reverse the NSID minus its final segment):

```
_lexicon.roe.dev  TXT  "did=<did of the repo the schemas were published to>"
```

`pnpm lex:publish` prints the exact value to use.

Resolution is not hierarchical, so any future authority (e.g. `dev.roe.cms`)
needs its own `_lexicon.cms.roe.dev` record.

See [Lexicon publication and resolution](https://atproto.com/specs/lexicon#lexicon-publication-and-resolution).
