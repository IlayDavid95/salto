/*
 *                      Copyright 2024 Salto Labs Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ElemID, InstanceElement, ReferenceExpression, toChange } from '@salto-io/adapter-api'
import {
  createDefinitionForGroupLifecyclePolicyGroupModification,
  getGroupLifecyclePolicyGroupModificationRequest,
} from '../../../src/definitions/deploy/utils'
import { contextMock, objectTypeMock } from '../../mocks'
import { ADAPTER_NAME, GROUP_LIFE_CYCLE_POLICY_FIELD_NAME } from '../../../src/constants'

const lifeCycleReference = new ReferenceExpression(new ElemID(ADAPTER_NAME, 'obj', 'instance', 'test'), {
  value: { id: 'testLifeCyclePolicyId' },
})
const instanceWithLifecyclePolicyRef = new InstanceElement('instance', objectTypeMock, {
  [GROUP_LIFE_CYCLE_POLICY_FIELD_NAME]: lifeCycleReference,
})

describe(`${getGroupLifecyclePolicyGroupModificationRequest.name}`, () => {
  describe('addition', () => {
    it('should return the correct path', () => {
      const { endpoint } = getGroupLifecyclePolicyGroupModificationRequest('add')
      expect(endpoint?.path).toEqual('/groupLifecyclePolicies/{lifeCyclePolicyId}/addGroup')
    })

    it('should add the lifeCyclePolicyId to the context', () => {
      const change = toChange({ after: instanceWithLifecyclePolicyRef })
      const { context } = getGroupLifecyclePolicyGroupModificationRequest('add')
      const resultContext = context?.custom?.({})({ ...contextMock, change })
      expect(resultContext?.lifeCyclePolicyId).toEqual('testLifeCyclePolicyId')
    })
  })

  describe('removal', () => {
    it('should return the correct path', () => {
      const { endpoint } = getGroupLifecyclePolicyGroupModificationRequest('remove')
      expect(endpoint?.path).toEqual('/groupLifecyclePolicies/{lifeCyclePolicyId}/removeGroup')
    })

    it('should add the lifeCyclePolicyId to the context', () => {
      const change = toChange({ before: instanceWithLifecyclePolicyRef })
      const { context } = getGroupLifecyclePolicyGroupModificationRequest('remove')
      const resultContext = context?.custom?.({})({ ...contextMock, change })
      expect(resultContext?.lifeCyclePolicyId).toEqual('testLifeCyclePolicyId')
    })
  })

  describe('adjust function', () => {
    it('when the value is not a plain object', async () => {
      const { transformation } = getGroupLifecyclePolicyGroupModificationRequest('add')
      await expect(
        transformation?.adjust?.({ value: 'not an object', typeName: 'group', context: contextMock }),
      ).rejects.toThrow()
    })

    it('should return the object id as the group id', async () => {
      const { transformation } = getGroupLifecyclePolicyGroupModificationRequest('add')
      const adjustedItem = await transformation?.adjust?.({
        value: { id: 'id1', anotherField: ['ignoreThis'] },
        typeName: 'group',
        context: contextMock,
      })
      expect(adjustedItem?.value).toEqual({ groupId: 'id1' })
    })
  })
})

describe(`${createDefinitionForGroupLifecyclePolicyGroupModification.name}`, () => {
  describe('custom condition', () => {
    const instanceWithoutLifecyclePolicyRef = new InstanceElement('instance', objectTypeMock, {})

    it('should return false for non modification changes', () => {
      const change = toChange({ after: instanceWithLifecyclePolicyRef })
      const { condition } = createDefinitionForGroupLifecyclePolicyGroupModification('add')
      expect(condition?.custom?.({})({ ...contextMock, change })).toEqual(false)
    })

    describe('when the action is add', () => {
      it('should return false when the group lifecycle policy is not present', () => {
        const change = toChange({ before: instanceWithLifecyclePolicyRef, after: instanceWithoutLifecyclePolicyRef })
        const { condition } = createDefinitionForGroupLifecyclePolicyGroupModification('add')
        expect(condition?.custom?.({})({ ...contextMock, change })).toEqual(false)
      })

      it('should return true when the group lifecycle policy is present', () => {
        const change = toChange({ before: instanceWithoutLifecyclePolicyRef, after: instanceWithLifecyclePolicyRef })
        const { condition } = createDefinitionForGroupLifecyclePolicyGroupModification('add')
        expect(condition?.custom?.({})({ ...contextMock, change })).toEqual(true)
      })
    })

    describe('when the action is remove', () => {
      it('should return false when the group lifecycle policy is present', () => {
        const change = toChange({ before: instanceWithoutLifecyclePolicyRef, after: instanceWithLifecyclePolicyRef })
        const { condition } = createDefinitionForGroupLifecyclePolicyGroupModification('remove')
        expect(condition?.custom?.({})({ ...contextMock, change })).toEqual(false)
      })

      it('should return true when the group lifecycle policy is not present', () => {
        const change = toChange({ before: instanceWithLifecyclePolicyRef, after: instanceWithoutLifecyclePolicyRef })
        const { condition } = createDefinitionForGroupLifecyclePolicyGroupModification('remove')
        expect(condition?.custom?.({})({ ...contextMock, change })).toEqual(true)
      })
    })
  })
})
