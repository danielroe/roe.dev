import { shallowMount } from '@vue/test-utils'
import ItemList from '~/components/ItemList.vue'

describe('ItemList.vue', () => {
  it('renders slot', () => {
    const msg = 'new message'
    const wrapper = shallowMount(ItemList, {
      slots: {
        default: msg,
      },
    })
    expect(wrapper.text()).toMatch(msg)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
