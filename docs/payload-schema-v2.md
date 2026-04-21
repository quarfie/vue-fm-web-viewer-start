# Universal Print Module Payload Schema v2

Status: active
Version: 2

This document defines the canonical report payload used by:
- FileMaker -> web app setup payloads
- web app save payloads
- backend-only document/PDF rendering services

The goal is one renderer-agnostic contract.

## Top-level shape

```json
{
  "schemaVersion": 2,
  "meta": {},
  "template": {},
  "content": {},
  "runtime": {}
}
```

Top-level keys:
- schemaVersion: number, required. Must be 2 for this contract.
- meta: object, required. Universal document metadata.
- template: object, required. Template-scoped configuration.
- content: object, required. Document content used by renderers.
- runtime: object, optional. App/runtime-only state, not persisted as document data.

## meta

```json
{
  "status": "draft",
  "language": "en",
  "bilingual": true,
  "pageSize": "Letter"
}
```

Fields:
- status: string, required. Allowed: draft, final.
- language: string, required. Allowed: en, fr.
- bilingual: boolean, required.
- pageSize: string, required. Allowed: Letter, Legal.

## template

```json
{
  "options": {
    "type": "prac",
    "property": true
  }
}
```

Fields:
- options: object, required.
- options.type: string, required for this template.
  - Current values include: prac, preliminary, public_hearing, public_presentation, council_subdivision.
- options.property: boolean, required for this template.

Notes:
- template.id is intentionally deferred for now.
- Future templates should extend under template without changing content semantics.

## content

```json
{
  "attachments": [],
  "fields": {},
  "detail": [],
  "images": {},
  "signatures": [],
  "exhibits": []
}
```

### content.attachments

Used by backend PDF pipeline for appending additional PDFs.

```json
[
  {
    "filename": "site-plan.pdf",
    "url": "https://example.com/site-plan.pdf"
  }
]
```

Fields:
- filename: string, required.
- url: string, required.

### content.fields

Contains core report fields including recipient block.

Field value rules (canonical):
- Localized text: object with en and fr strings.
- Language-neutral text: plain string.

Example:

```json
{
  "to": { "en": "...", "fr": "..." },
  "subject": { "en": "...", "fr": "..." },
  "meetingDate": { "en": "2025-02-01", "fr": "2025-02-01" },
  "agendaItem": { "en": "2B", "fr": "2B" },
  "fileNumber": "26-12345",
  "applicant": "Riverbend Homes Ltd.",
  "landowner": "Riverbend Holdings Inc.",
  "proposal": { "en": "...", "fr": "..." },
  "pid": "70234567",
  "lotSize": { "en": "1,480 m2", "fr": "1 480 m2" },
  "location": { "en": "...", "fr": "..." },
  "municipality": "Example Municipality",
  "zoning": { "en": "...", "fr": "..." },
  "futureUse": { "en": "...", "fr": "..." },
  "currentUse": { "en": "...", "fr": "..." },
  "surroundingUse": { "en": "...", "fr": "..." },
  "municipalServices": { "en": "...", "fr": "..." },
  "access": { "en": "...", "fr": "..." }
}
```

### content.detail

Moved from legacy fields.detail to content.detail.

```json
[
  {
    "name": { "en": "Analysis", "fr": "Analyse" },
    "value": { "en": "...", "fr": "..." }
  }
]
```

### content.images

Image entries can carry both image payload and associated metadata in data.

Current template uses:

```json
{
  "propertyLocation": {
    "image": {
      "id": 1,
      "filename": "property-location.png",
      "url": "https://..."
    },
    "data": {
      "legendColor": "#fdba74"
    }
  }
}
```

Fields:
- image: object, optional keys depending on source (id, filename, url, sizeInches, etc.).
- data: object, template-specific metadata for the image slot.
- data.legendColor: string, optional. Used by property location map legend.

### content.signatures

```json
[
  {
    "id_Role": 10,
    "label": { "en": "From", "fr": "De" },
    "user": {
      "name": "Alex Mercer",
      "title": { "en": "Planner", "fr": "Urbaniste" },
      "signature": "<base64 png>"
    }
  }
]
```

Fields:
- id_Role: number, required.
- label: localized text, required.
- user: object or null.

### content.exhibits

```json
[
  {
    "title": { "en": "Location", "fr": "Emplacement" },
    "description": { "en": "...", "fr": "..." },
    "images": {
      "a": {
        "id": 2,
        "filename": "exhibit-location.png",
        "url": "https://...",
        "sizeInches": 4.5
      }
    }
  }
]
```

## runtime (optional)

runtime is for app-only state and should not be treated as persisted document content.

```json
{
  "error": ""
}
```

## Save-time sanitization rules

Current app behavior before save:
- removes content.images.*.image.url
- removes content.exhibits[*].images.*.url
- removes content.signatures[*].user.signature
- removes runtime
- keeps content.attachments

This allows the app to persist document data while stripping transient binary/URL transport data.

### Round-trip contract (FileMaker rehydration required)

Because transient fields are intentionally stripped before save, the payload returned to the app later is expected to be rehydrated by FileMaker (or another backend service) before calling setup.

Required rehydration behavior:
- signatures:
  - stripped on save: content.signatures[*].user.signature (base64 png)
  - must be restored on load when available so signed documents can render signature images.
- image URLs:
  - stripped on save: content.images.*.image.url
  - stripped on save: content.exhibits[*].images.*.url
  - must be restored on load with fresh presigned URLs because stored URLs expire.

In other words, the persisted payload in FileMaker is the durable document core, while base64 signature image data and presigned URLs are treated as transient transport fields that are reattached for rendering sessions.

## Compatibility and migration notes

- Legacy keys removed from canonical schema: id_Project, svgHeader, svgFooter.
- Legacy root keys moved:
  - status/language/bilingual/pageSize -> meta
  - type/property -> template.options
  - fields/images/signatures/exhibits -> content
  - fields.detail -> content.detail
  - to -> content.fields.to
  - legendColor -> content.images.propertyLocation.data.legendColor
- Legacy bi object values are coerced to plain strings by the app normalization layer.

## Minimal valid example

```json
{
  "schemaVersion": 2,
  "meta": {
    "status": "draft",
    "language": "en",
    "bilingual": false,
    "pageSize": "Letter"
  },
  "template": {
    "options": {
      "type": "prac",
      "property": true
    }
  },
  "content": {
    "attachments": [],
    "fields": {
      "to": { "en": "", "fr": "" },
      "subject": { "en": "", "fr": "" },
      "meetingDate": { "en": "", "fr": "" },
      "agendaItem": { "en": "", "fr": "" },
      "fileNumber": "",
      "applicant": "",
      "landowner": "",
      "proposal": { "en": "", "fr": "" },
      "pid": "",
      "lotSize": { "en": "", "fr": "" },
      "location": { "en": "", "fr": "" },
      "municipality": "",
      "zoning": { "en": "", "fr": "" },
      "futureUse": { "en": "", "fr": "" },
      "currentUse": { "en": "", "fr": "" },
      "surroundingUse": { "en": "", "fr": "" },
      "municipalServices": { "en": "", "fr": "" },
      "access": { "en": "", "fr": "" }
    },
    "detail": [],
    "images": {
      "propertyLocation": {
        "image": {},
        "data": {
          "legendColor": "#fdba74"
        }
      }
    },
    "signatures": [],
    "exhibits": []
  }
}
```
