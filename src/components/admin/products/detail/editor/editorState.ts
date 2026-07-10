import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { RelatedProductPick } from '../../../../../types/adminProductRelated'

const DESCRIPTION_FIELD_KEYS = ['description', 'detail_media', 'short_description'] as const

type DescriptionFieldKey = (typeof DESCRIPTION_FIELD_KEYS)[number]

export function serializeEditorState(
  form: AdminProductDetailForm,
  relatedProducts: RelatedProductPick[],
): string {
  return JSON.stringify({
    form,
    relatedProductIds: relatedProducts.map((item) => item.id),
  })
}

export function parseEditorState(
  snapshot: string,
): { form: AdminProductDetailForm; relatedProductIds: string[] } | null {
  if (!snapshot.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(snapshot) as {
      form?: AdminProductDetailForm
      relatedProductIds?: string[]
    }

    if (!parsed.form) {
      return null
    }

    return {
      form: parsed.form,
      relatedProductIds: Array.isArray(parsed.relatedProductIds) ? parsed.relatedProductIds : [],
    }
  } catch {
    return null
  }
}

function omitDescriptionFields(form: AdminProductDetailForm): Omit<
  AdminProductDetailForm,
  DescriptionFieldKey
> {
  const { description: _description, detail_media: _detailMedia, short_description: _shortDescription, ...rest } =
    form
  return rest
}

function pickDescriptionFields(
  form: AdminProductDetailForm,
): Pick<AdminProductDetailForm, DescriptionFieldKey> {
  return {
    description: form.description,
    detail_media: form.detail_media,
    short_description: form.short_description,
  }
}

/** True when only description-related fields changed since last save. */
export function isDescriptionOnlySave(
  nextForm: AdminProductDetailForm,
  savedSnapshot: string,
  relatedProducts: RelatedProductPick[],
): boolean {
  const saved = parseEditorState(savedSnapshot)
  if (!saved) {
    return false
  }

  const nextRelatedIds = relatedProducts.map((item) => item.id).sort()
  const savedRelatedIds = [...saved.relatedProductIds].sort()
  if (JSON.stringify(nextRelatedIds) !== JSON.stringify(savedRelatedIds)) {
    return false
  }

  if (
    JSON.stringify(omitDescriptionFields(nextForm)) !==
    JSON.stringify(omitDescriptionFields(saved.form))
  ) {
    return false
  }

  return (
    JSON.stringify(pickDescriptionFields(nextForm)) !==
    JSON.stringify(pickDescriptionFields(saved.form))
  )
}
