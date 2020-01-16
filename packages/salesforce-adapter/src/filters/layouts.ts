import _ from 'lodash'
import {
  Element, isObjectType, ElemID, findInstances, InstanceElement, ReferenceExpression,
} from 'adapter-api'
import { apiName } from '../transformers/transformer'
import { FilterCreator } from '../filter'
import { SALESFORCE, SALESFORCE_CUSTOM_SUFFIX } from '../constants'
import { id } from './utils'

export const LAYOUT_TYPE_ID = new ElemID(SALESFORCE, 'layout')
export const LAYOUT_ANNOTATION = 'layouts'
export const LAYOUT_SUFFIX = 'layout'

const MIN_NAME_LENGTH = 4

// Layout full name starts with related sobject and then '-'
const layoutObj = (layout: InstanceElement): string => apiName(layout).split('-')[0]

const fixNames = (layouts: InstanceElement[]): void => {
  const name = (elem: Element): string => elem.elemID.name
  let names = layouts.map(id)

  const updateElemID = (layout: InstanceElement, newName: string): void => {
    if (newName.length < MIN_NAME_LENGTH) {
      return
    }
    const newId = layout.type.elemID.createNestedID('instance', newName)
    if (!names.includes(newId.getFullName())) {
      names = _.without(names, id(layout))
      names.push(newId.getFullName())
      layout.elemID = newId
    }
  }

  layouts.forEach(l => {
    if (name(l).endsWith(LAYOUT_SUFFIX)) {
      updateElemID(l, _.trimEnd(name(l).slice(0, -1 * LAYOUT_SUFFIX.length), '_'))
    }
    const objName = layoutObj(l)
    const objNameNoSuffix = objName.endsWith(SALESFORCE_CUSTOM_SUFFIX)
      ? objName.slice(0, -1 * SALESFORCE_CUSTOM_SUFFIX.length)
      : objName
    if (name(l).startsWith(`${objName}_${objNameNoSuffix}`)) {
      updateElemID(l, _.trimStart(name(l).slice(objName.length), '_'))
    }
    if (l.path) {
      l.path = [...l.path.slice(0, -1), name(l)]
    }
  })
}

/**
* Declare the layout filter, this filter adds reference from the sobject to it's layouts.
*/
const filterCreator: FilterCreator = () => ({
  /**
   * Upon fetch, add layout annotations to relevant sobjects.
   *
   * @param elements the already fetched elements
   */
  onFetch: async (elements: Element[]): Promise<void> => {
    const layouts = [...findInstances(elements, LAYOUT_TYPE_ID)]
    fixNames(layouts)

    const obj2layout = _(layouts)
      .groupBy(layoutObj)
      .value()

    elements
      .filter(isObjectType)
      .forEach(obj => {
        const objName = apiName(obj)
        if (objName) {
          const objLayouts = obj2layout[objName]
          if (objLayouts) {
            obj.annotate({ [LAYOUT_ANNOTATION]: _.sortBy(objLayouts, id).map(layout =>
              new ReferenceExpression(layout.elemID)) })
          }
        }
      })
  },
})

export default filterCreator
