import { describe, expect, it } from 'vitest'
import { filterPublicServices } from './get-tenant-by-slug.utils'

describe('filterPublicServices', () => {
  it('excluye servicios inactivos', () => {
    expect(
      filterPublicServices([
        { id: '1', active: true },
        { id: '2', active: false },
        { id: '3', active: true },
      ]),
    ).toEqual([
      { id: '1', active: true },
      { id: '3', active: true },
    ])
  })

  it('devuelve vacío si todos están inactivos', () => {
    expect(filterPublicServices([{ id: '1', active: false }])).toEqual([])
  })
})
