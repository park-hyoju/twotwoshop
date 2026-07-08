import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { RelatedProductPick } from '../../../../../types/adminProductRelated'

export function serializeEditorState(
  form: AdminProductDetailForm,
  relatedProducts: RelatedProductPick[],
): string {
  return JSON.stringify({
    form,
    relatedProductIds: relatedProducts.map((item) => item.id),
  })
}
