import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VersionHistory from '../VersionHistory.vue'
import type { SnapshotVersion } from '@/types/asset'

const mockVersions: SnapshotVersion[] = [
  { versionNumber: 3, createdAt: '2026-05-19T14:00:00Z', contentHash: 'c', description: 'Updated', sizeBytes: 1024 },
  { versionNumber: 2, createdAt: '2026-05-19T13:00:00Z', contentHash: 'b', description: 'Added section', sizeBytes: 900 },
  { versionNumber: 1, createdAt: '2026-05-19T12:00:00Z', contentHash: 'a', description: 'Initial', sizeBytes: 800 },
]

describe('VersionHistory', () => {
  it('renders version list', () => {
    const wrapper = mount(VersionHistory, {
      props: { versions: mockVersions, isOpen: true },
    })
    expect(wrapper.find('.version-history').exists()).toBe(true)
    expect(wrapper.findAll('.version-history__item').length).toBe(3)
  })

  it('does not render when isOpen is false', () => {
    const wrapper = mount(VersionHistory, {
      props: { versions: mockVersions, isOpen: false },
    })
    expect(wrapper.find('.version-history').exists()).toBe(false)
  })

  it('emits restore with version number', async () => {
    const wrapper = mount(VersionHistory, {
      props: { versions: mockVersions, isOpen: true },
    })
    await wrapper.findAll('.version-history__restore-btn')[0].trigger('click')
    expect(wrapper.emitted('restore')).toBeTruthy()
    expect(wrapper.emitted('restore')![0][0]).toBe(3)
  })

  it('emits close', async () => {
    const wrapper = mount(VersionHistory, {
      props: { versions: mockVersions, isOpen: true },
    })
    await wrapper.find('.version-history__close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows version descriptions', () => {
    const wrapper = mount(VersionHistory, {
      props: { versions: mockVersions, isOpen: true },
    })
    expect(wrapper.text()).toContain('Updated')
    expect(wrapper.text()).toContain('Added section')
    expect(wrapper.text()).toContain('Initial')
  })
})
