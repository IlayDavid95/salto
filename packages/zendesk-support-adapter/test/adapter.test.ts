/*
*                      Copyright 2022 Salto Labs Ltd.
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
import _ from 'lodash'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { InstanceElement, isObjectType, isInstanceElement, ReferenceExpression, isRemovalChange,
  AdapterOperations, toChange, ObjectType, ElemID, getChangeData } from '@salto-io/adapter-api'
import { buildElementsSourceFromElements } from '@salto-io/adapter-utils'
import mockReplies from './mock_replies.json'
import { adapter } from '../src/adapter_creator'
import { usernamePasswordCredentialsType } from '../src/auth'
import { configType, FETCH_CONFIG, API_DEFINITIONS_CONFIG, DEFAULT_INCLUDE_ENDPOINTS } from '../src/config'
import { ZENDESK_SUPPORT } from '../src/constants'

type MockReply = {
  url: string
  params: Record<string, string>
  response: unknown
}

const mockDeployChange = jest.fn()
jest.mock('@salto-io/adapter-components', () => {
  const actual = jest.requireActual('@salto-io/adapter-components')
  return {
    ...actual,
    deployment: {
      ...actual.deployment,
      deployChange: jest.fn((...args) => mockDeployChange(...args)),
    },
  }
})

describe('adapter', () => {
  let mockAxiosAdapter: MockAdapter

  beforeEach(async () => {
    mockAxiosAdapter = new MockAdapter(axios, { delayResponse: 1, onNoMatch: 'throwException' })
    mockAxiosAdapter.onGet('/account/settings').replyOnce(200, { settings: {} });
    (mockReplies as MockReply[]).forEach(({ url, params, response }) => {
      mockAxiosAdapter.onGet(url, !_.isEmpty(params) ? { params } : undefined).replyOnce(
        200, response
      )
    })
  })

  afterEach(() => {
    mockAxiosAdapter.restore()
  })

  describe('fetch', () => {
    describe('full fetch', () => {
      it('should generate the right elements on fetch', async () => {
        const { elements } = await adapter.operations({
          credentials: new InstanceElement(
            'config',
            usernamePasswordCredentialsType,
            { username: 'user123', password: 'token456' },
          ),
          config: new InstanceElement(
            'config',
            configType,
            {
              [FETCH_CONFIG]: {
                includeTypes: DEFAULT_INCLUDE_ENDPOINTS.sort(),
              },
            }
          ),
          elementsSource: buildElementsSourceFromElements([]),
        }).fetch({ progressReporter: { reportProgress: () => null } })
        expect(elements).toHaveLength(349)
        expect(elements.filter(isObjectType)).toHaveLength(176)
        expect(elements.filter(isInstanceElement)).toHaveLength(173)
        expect(elements.map(e => e.elemID.getFullName()).sort()).toEqual([
          'zendesk_support.account_setting',
          'zendesk_support.account_setting.instance',
          'zendesk_support.account_setting__active_features',
          'zendesk_support.account_setting__agents',
          'zendesk_support.account_setting__api',
          'zendesk_support.account_setting__apps',
          'zendesk_support.account_setting__billing',
          'zendesk_support.account_setting__branding',
          'zendesk_support.account_setting__brands',
          'zendesk_support.account_setting__cdn',
          'zendesk_support.account_setting__cdn__hosts',
          'zendesk_support.account_setting__chat',
          'zendesk_support.account_setting__cross_sell',
          'zendesk_support.account_setting__gooddata_advanced_analytics',
          'zendesk_support.account_setting__google_apps',
          'zendesk_support.account_setting__groups',
          'zendesk_support.account_setting__knowledge',
          'zendesk_support.account_setting__limits',
          'zendesk_support.account_setting__localization',
          'zendesk_support.account_setting__lotus',
          'zendesk_support.account_setting__metrics',
          'zendesk_support.account_setting__onboarding',
          'zendesk_support.account_setting__routing',
          'zendesk_support.account_setting__rule',
          'zendesk_support.account_setting__screencast',
          'zendesk_support.account_setting__statistics',
          'zendesk_support.account_setting__ticket_form',
          'zendesk_support.account_setting__ticket_sharing_partners',
          'zendesk_support.account_setting__tickets',
          'zendesk_support.account_setting__twitter',
          'zendesk_support.account_setting__user',
          'zendesk_support.account_setting__voice',
          'zendesk_support.account_settings',
          'zendesk_support.app_installation',
          'zendesk_support.app_installation.instance.Salesforce',
          'zendesk_support.app_installation.instance.Slack',
          'zendesk_support.app_installation__plan_information',
          'zendesk_support.app_installation__settings',
          'zendesk_support.app_installation__settings_objects',
          'zendesk_support.app_installations',
          'zendesk_support.apps_owned',
          'zendesk_support.automation',
          'zendesk_support.automation.instance.Close_ticket_4_days_after_status_is_set_to_solved@s',
          'zendesk_support.automation.instance.Close_ticket_5_days_after_status_is_set_to_solved@s',
          'zendesk_support.automation.instance.Pending_notification_24_hours@s',
          'zendesk_support.automation.instance.Pending_notification_5_days@s',
          'zendesk_support.automation.instance.Tag_tickets_from_Social@s',
          'zendesk_support.automation__actions',
          'zendesk_support.automation__conditions',
          'zendesk_support.automation__conditions__all',
          'zendesk_support.automation__conditions__any',
          'zendesk_support.automations',
          'zendesk_support.brand',
          'zendesk_support.brand.instance.myBrand',
          'zendesk_support.brands',
          'zendesk_support.business_hours_schedule',
          'zendesk_support.business_hours_schedule.instance.New_schedule@s',
          'zendesk_support.business_hours_schedule.instance.Schedule_2@s',
          'zendesk_support.business_hours_schedule.instance.Schedule_3@s',
          'zendesk_support.business_hours_schedule__intervals',
          'zendesk_support.business_hours_schedule_holiday',
          'zendesk_support.business_hours_schedule_holiday.instance.New_schedule_s__Holiday1@umuu',
          'zendesk_support.business_hours_schedule_holiday.instance.Schedule_3_s__Holi2@umuu',
          'zendesk_support.business_hours_schedules',
          'zendesk_support.custom_role',
          'zendesk_support.custom_role.instance.Advisor',
          'zendesk_support.custom_role.instance.Billing_admin@s',
          'zendesk_support.custom_role.instance.Contributor',
          'zendesk_support.custom_role.instance.Light_agent@s',
          'zendesk_support.custom_role.instance.Staff',
          'zendesk_support.custom_role.instance.Team_lead@s',
          'zendesk_support.custom_role__configuration',
          'zendesk_support.custom_roles',
          'zendesk_support.dynamic_content_item',
          'zendesk_support.dynamic_content_item.instance.Dynamic_content_item_title_543@s',
          'zendesk_support.dynamic_content_item.instance.dynamic_content_item_544@s',
          'zendesk_support.dynamic_content_item__variants',
          'zendesk_support.dynamic_content_item__variants.instance.Dynamic_content_item_title_543_s__1@uuuumuu',
          'zendesk_support.dynamic_content_item__variants.instance.dynamic_content_item_544_s__1@uuumuu',
          'zendesk_support.dynamic_content_item__variants.instance.dynamic_content_item_544_s__2@uuumuu',
          'zendesk_support.dynamic_content_item__variants.instance.dynamic_content_item_544_s__30@uuumuu',
          'zendesk_support.group',
          'zendesk_support.group.instance.Support',
          'zendesk_support.group.instance.Support2',
          'zendesk_support.group.instance.Support4',
          'zendesk_support.group.instance.Support5',
          'zendesk_support.groups',
          'zendesk_support.locale',
          'zendesk_support.locale.instance.en_US@b',
          'zendesk_support.locale.instance.es',
          'zendesk_support.locale.instance.he',
          'zendesk_support.locales',
          'zendesk_support.macro',
          'zendesk_support.macro.instance.Close_and_redirect_to_topics@s',
          'zendesk_support.macro.instance.Close_and_redirect_to_topics_2@s',
          'zendesk_support.macro.instance.Customer_not_responding@s',
          'zendesk_support.macro.instance.Customer_not_responding__copy__with_rich_text@sssjksss',
          'zendesk_support.macro.instance.Downgrade_and_inform@s',
          'zendesk_support.macro.instance.MacroCategory__NewCategory@f',
          'zendesk_support.macro.instance.Take_it_@sl',
          'zendesk_support.macro.instance.Test',
          'zendesk_support.macro__actions',
          'zendesk_support.macro_action',
          'zendesk_support.macro_action__operators',
          'zendesk_support.macro_action__values',
          'zendesk_support.macro_action__values__list',
          'zendesk_support.macro_categories',
          'zendesk_support.macro_categories.instance',
          'zendesk_support.macro_definition',
          'zendesk_support.macro_definition.instance',
          'zendesk_support.macro_definition__actions',
          'zendesk_support.macro_definition__actions__values',
          'zendesk_support.macros',
          'zendesk_support.macros_actions',
          'zendesk_support.macros_actions.instance',
          'zendesk_support.macros_definitions',
          'zendesk_support.monitored_twitter_handles',
          'zendesk_support.oauth_client',
          'zendesk_support.oauth_client.instance.c123',
          'zendesk_support.oauth_client.instance.c124_modified',
          'zendesk_support.oauth_client.instance.myBrand_test',
          'zendesk_support.oauth_client.instance.myBrand_test_oauth',
          'zendesk_support.oauth_client.instance.myBrand_zendesk_client',
          'zendesk_support.oauth_clients',
          'zendesk_support.oauth_global_client',
          'zendesk_support.oauth_global_client.instance.myBrand',
          'zendesk_support.oauth_global_client.instance.myBrand_staging@s',
          'zendesk_support.oauth_global_clients',
          'zendesk_support.organization',
          'zendesk_support.organization.instance.myBrand',
          'zendesk_support.organization.instance.test_org_123@s',
          'zendesk_support.organization.instance.test_org_124@s',
          'zendesk_support.organization__organization_fields',
          'zendesk_support.organization_field',
          'zendesk_support.organization_field.instance.dropdown_26',
          'zendesk_support.organization_field.instance.org_field301',
          'zendesk_support.organization_field.instance.org_field302',
          'zendesk_support.organization_field.instance.org_field305',
          'zendesk_support.organization_field.instance.org_field306',
          'zendesk_support.organization_field.instance.org_field307',
          'zendesk_support.organization_field.instance.org_field_n403',
          'zendesk_support.organization_field.instance.org_field_n404',
          'zendesk_support.organization_field__custom_field_options',
          'zendesk_support.organization_field__custom_field_options.instance.dropdown_26__123',
          'zendesk_support.organization_field__custom_field_options.instance.dropdown_26__v1',
          'zendesk_support.organization_field__custom_field_options.instance.dropdown_26__v2',
          'zendesk_support.organization_field__custom_field_options.instance.dropdown_26__v3',
          'zendesk_support.organization_field_order',
          'zendesk_support.organization_field_order.instance',
          'zendesk_support.organization_fields',
          'zendesk_support.organizations',
          'zendesk_support.resource_collection',
          'zendesk_support.resource_collection.instance.unnamed_0_0',
          'zendesk_support.resource_collection__resources',
          'zendesk_support.resource_collections',
          'zendesk_support.routing_attribute',
          'zendesk_support.routing_attribute.instance.Language',
          'zendesk_support.routing_attribute.instance.Location',
          'zendesk_support.routing_attribute_definition',
          'zendesk_support.routing_attribute_definition.instance',
          'zendesk_support.routing_attribute_definition__conditions_all',
          'zendesk_support.routing_attribute_definition__conditions_all__operators',
          'zendesk_support.routing_attribute_definition__conditions_all__values',
          'zendesk_support.routing_attribute_definition__conditions_any',
          'zendesk_support.routing_attribute_definition__conditions_any__operators',
          'zendesk_support.routing_attribute_definition__conditions_any__values',
          'zendesk_support.routing_attribute_definitions',
          'zendesk_support.routing_attribute_value',
          'zendesk_support.routing_attribute_value.instance.Language__Italian',
          'zendesk_support.routing_attribute_value.instance.Language__Spanish',
          'zendesk_support.routing_attribute_value.instance.Location__San_Francisco@uus',
          'zendesk_support.routing_attribute_value.instance.Location__Tel_Aviv@uus',
          'zendesk_support.routing_attribute_value__conditions',
          'zendesk_support.routing_attribute_value__conditions__all',
          'zendesk_support.routing_attributes',
          'zendesk_support.sharing_agreements',
          'zendesk_support.sla_policies',
          'zendesk_support.sla_policies_definitions',
          'zendesk_support.sla_policy',
          'zendesk_support.sla_policy.instance.SLA_501@s',
          'zendesk_support.sla_policy.instance.SLA_502@s',
          'zendesk_support.sla_policy__filter',
          'zendesk_support.sla_policy__filter__all',
          'zendesk_support.sla_policy__policy_metrics',
          'zendesk_support.sla_policy_definition',
          'zendesk_support.sla_policy_definition.instance',
          'zendesk_support.sla_policy_definition__all',
          'zendesk_support.sla_policy_definition__all__operators',
          'zendesk_support.sla_policy_definition__all__values',
          'zendesk_support.sla_policy_definition__all__values__label',
          'zendesk_support.sla_policy_definition__all__values__labels',
          'zendesk_support.sla_policy_definition__all__values__list',
          'zendesk_support.sla_policy_definition__any',
          'zendesk_support.sla_policy_definition__any__operators',
          'zendesk_support.sla_policy_definition__any__values',
          'zendesk_support.sla_policy_definition__any__values__label',
          'zendesk_support.sla_policy_definition__any__values__labels',
          'zendesk_support.sla_policy_definition__any__values__list',
          'zendesk_support.support_address',
          'zendesk_support.support_address.instance.myBrand',
          'zendesk_support.support_addresses',
          'zendesk_support.target',
          'zendesk_support.target.instance.Slack_integration_Endpoint_url_target_v2@ssuuu',
          'zendesk_support.targets',
          'zendesk_support.ticket_field',
          'zendesk_support.ticket_field.instance.assignee_Assignee',
          'zendesk_support.ticket_field.instance.description_Description',
          'zendesk_support.ticket_field.instance.group_Group',
          'zendesk_support.ticket_field.instance.multiselect_Customer_Tier@us',
          'zendesk_support.ticket_field.instance.multiselect_Product_components@us',
          'zendesk_support.ticket_field.instance.multiselect_agent_dropdown_643_for_agent@ussss',
          'zendesk_support.ticket_field.instance.partialcreditcard_credit_card_1@uss',
          'zendesk_support.ticket_field.instance.priority_Priority',
          'zendesk_support.ticket_field.instance.regexp_zip_code_with_validation@usss',
          'zendesk_support.ticket_field.instance.status_Status',
          'zendesk_support.ticket_field.instance.subject_Subject',
          'zendesk_support.ticket_field.instance.text_agent_field_431@uss',
          'zendesk_support.ticket_field.instance.tickettype_Type',
          'zendesk_support.ticket_field__custom_field_options',
          'zendesk_support.ticket_field__custom_field_options.instance.multiselect_Customer_Tier_us__Enterprise@uumuu',
          'zendesk_support.ticket_field__custom_field_options.instance.multiselect_Customer_Tier_us__Free@uumuu',
          'zendesk_support.ticket_field__custom_field_options.instance.multiselect_Customer_Tier_us__Paying@uumuu',
          'zendesk_support.ticket_field__custom_field_options.instance.multiselect_Product_components_us__Component_A@uumuus',
          'zendesk_support.ticket_field__custom_field_options.instance.multiselect_Product_components_us__Component_B@uumuus',
          'zendesk_support.ticket_field__custom_field_options.instance.multiselect_agent_dropdown_643_for_agent_ussss__v1@uuuuumuu',
          'zendesk_support.ticket_field__custom_field_options.instance.multiselect_agent_dropdown_643_for_agent_ussss__v2@uuuuumuu',
          'zendesk_support.ticket_field__system_field_options',
          'zendesk_support.ticket_fields',
          'zendesk_support.ticket_form',
          'zendesk_support.ticket_form.instance.Amazing_ticket_form@s',
          'zendesk_support.ticket_form.instance.Default_Ticket_Form@s',
          'zendesk_support.ticket_form.instance.Demo_ticket_form@s',
          'zendesk_support.ticket_form.instance.Form_11@s',
          'zendesk_support.ticket_form.instance.Form_12@s',
          'zendesk_support.ticket_form.instance.Form_13@s',
          'zendesk_support.ticket_form.instance.Form_6436@s',
          'zendesk_support.ticket_form_order',
          'zendesk_support.ticket_form_order.instance',
          'zendesk_support.ticket_forms',
          'zendesk_support.trigger',
          'zendesk_support.trigger.instance.Auto_assign_to_first_email_responding_agent@bsssss',
          'zendesk_support.trigger.instance.Notify_all_agents_of_received_request@s',
          'zendesk_support.trigger.instance.Notify_assignee_of_assignment@s',
          'zendesk_support.trigger.instance.Notify_assignee_of_comment_update@s',
          'zendesk_support.trigger.instance.Notify_assignee_of_reopened_ticket@s',
          'zendesk_support.trigger.instance.Notify_group_of_assignment@s',
          'zendesk_support.trigger.instance.Notify_requester_and_CCs_of_comment_update@s',
          'zendesk_support.trigger.instance.Notify_requester_and_CCs_of_received_request@s',
          'zendesk_support.trigger.instance.Notify_requester_of_new_proactive_ticket@s',
          'zendesk_support.trigger.instance.Slack_Ticket_Trigger@s',
          'zendesk_support.trigger__actions',
          'zendesk_support.trigger__conditions',
          'zendesk_support.trigger__conditions__all',
          'zendesk_support.trigger__conditions__any',
          'zendesk_support.trigger_categories',
          'zendesk_support.trigger_categories__links',
          'zendesk_support.trigger_categories__meta',
          'zendesk_support.trigger_category',
          'zendesk_support.trigger_category.instance.Custom_Events@s',
          'zendesk_support.trigger_category.instance.Custom_Events___edited@ssbs',
          'zendesk_support.trigger_category.instance.Notifications',
          'zendesk_support.trigger_definition',
          'zendesk_support.trigger_definition.instance',
          'zendesk_support.trigger_definition__actions',
          'zendesk_support.trigger_definition__actions__metadata',
          'zendesk_support.trigger_definition__actions__metadata__phone_numbers',
          'zendesk_support.trigger_definition__actions__values',
          'zendesk_support.trigger_definition__conditions_all',
          'zendesk_support.trigger_definition__conditions_all__operators',
          'zendesk_support.trigger_definition__conditions_all__values',
          'zendesk_support.trigger_definition__conditions_any',
          'zendesk_support.trigger_definition__conditions_any__operators',
          'zendesk_support.trigger_definition__conditions_any__values',
          'zendesk_support.trigger_definitions',
          'zendesk_support.triggers',
          'zendesk_support.user_field',
          'zendesk_support.user_field.instance.another_text_3425',
          'zendesk_support.user_field.instance.date6436',
          'zendesk_support.user_field.instance.decimal_765_field',
          'zendesk_support.user_field.instance.description_123',
          'zendesk_support.user_field.instance.dropdown_25',
          'zendesk_support.user_field.instance.f201',
          'zendesk_support.user_field.instance.f202',
          'zendesk_support.user_field.instance.f203',
          'zendesk_support.user_field.instance.f204',
          'zendesk_support.user_field.instance.f205',
          'zendesk_support.user_field.instance.f206',
          'zendesk_support.user_field.instance.f207',
          'zendesk_support.user_field.instance.f208',
          'zendesk_support.user_field.instance.f209',
          'zendesk_support.user_field.instance.f210',
          'zendesk_support.user_field.instance.f211',
          'zendesk_support.user_field.instance.f212',
          'zendesk_support.user_field.instance.f213',
          'zendesk_support.user_field.instance.f214',
          'zendesk_support.user_field.instance.f215',
          'zendesk_support.user_field.instance.f216',
          'zendesk_support.user_field.instance.f217',
          'zendesk_support.user_field.instance.f218',
          'zendesk_support.user_field.instance.f219',
          'zendesk_support.user_field.instance.f220',
          'zendesk_support.user_field.instance.modified_multi75_key',
          'zendesk_support.user_field.instance.numeric65',
          'zendesk_support.user_field.instance.regex_6546',
          'zendesk_support.user_field.instance.this_is_a_checkbox',
          'zendesk_support.user_field__custom_field_options',
          'zendesk_support.user_field__custom_field_options.instance.dropdown_25__Choice1',
          'zendesk_support.user_field__custom_field_options.instance.dropdown_25__another_choice@uuus',
          'zendesk_support.user_field__custom_field_options.instance.dropdown_25__bla',
          'zendesk_support.user_field_order',
          'zendesk_support.user_field_order.instance',
          'zendesk_support.user_fields',
          'zendesk_support.view',
          'zendesk_support.view.instance.All_unsolved_tickets@s',
          'zendesk_support.view.instance.Copy_of_All_unsolved_tickets@s',
          'zendesk_support.view.instance.Current_tasks@s',
          'zendesk_support.view.instance.Custom_view_1234@s',
          'zendesk_support.view.instance.Custom_view_123@s',
          'zendesk_support.view.instance.New_tickets_in_your_groups@s',
          'zendesk_support.view.instance.Overdue_tasks@s',
          'zendesk_support.view.instance.Pending_tickets@s',
          'zendesk_support.view.instance.Recently_solved_tickets@s',
          'zendesk_support.view.instance.Recently_updated_tickets@s',
          'zendesk_support.view.instance.Test',
          'zendesk_support.view.instance.Test2',
          'zendesk_support.view.instance.Unassigned_tickets@s',
          'zendesk_support.view.instance.Unassigned_tickets___2@ssbs',
          'zendesk_support.view.instance.Unsolved_tickets_in_your_groups@s',
          'zendesk_support.view.instance.Your_unsolved_tickets@s',
          'zendesk_support.view__conditions',
          'zendesk_support.view__conditions__all',
          'zendesk_support.view__conditions__any',
          'zendesk_support.view__execution',
          'zendesk_support.view__execution__columns',
          'zendesk_support.view__execution__custom_fields',
          'zendesk_support.view__execution__fields',
          'zendesk_support.view__execution__group',
          'zendesk_support.view__execution__sort',
          'zendesk_support.view__restriction',
          'zendesk_support.views',
          'zendesk_support.workspace',
          'zendesk_support.workspace.instance.New_Workspace_123@s',
          'zendesk_support.workspace__conditions',
          'zendesk_support.workspace__conditions__all',
          'zendesk_support.workspace__conditions__any',
          'zendesk_support.workspace__selected_macros',
          'zendesk_support.workspace_order',
          'zendesk_support.workspace_order.instance',
          'zendesk_support.workspaces',
        ])

        const supportAddress = elements.filter(isInstanceElement).find(e => e.elemID.getFullName().startsWith('zendesk_support.support_address.instance.myBrand'))
        expect(supportAddress).toBeDefined()
        expect(supportAddress?.value).toMatchObject({
          id: 1500000743022,
          default: true,
          name: 'myBrand',
          email: 'support@myBrand.zendesk.com',
          // eslint-disable-next-line camelcase
          brand_id: expect.any(ReferenceExpression),
        })
        expect(supportAddress?.value.brand_id.elemID.getFullName()).toEqual('zendesk_support.brand.instance.myBrand')
      })
    })

    describe('type overrides', () => {
      it('should fetch only the relevant types', async () => {
        const { elements } = await adapter.operations({
          credentials: new InstanceElement(
            'config',
            usernamePasswordCredentialsType,
            { username: 'user123', password: 'pwd456', subdomain: 'abc' },
          ),
          config: new InstanceElement(
            'config',
            configType,
            {
              [FETCH_CONFIG]: {
                includeTypes: ['groups'],
              },
              [API_DEFINITIONS_CONFIG]: {
                types: {
                  group: {
                    transformation: {
                      sourceTypeName: 'groups__groups',
                    },
                  },
                  groups: {
                    request: {
                      url: '/groups',
                    },
                    transformation: {
                      dataField: 'groups',
                    },
                  },
                },
              },
            },
          ),
          elementsSource: buildElementsSourceFromElements([]),
        }).fetch({ progressReporter: { reportProgress: () => null } })
        expect(elements).toHaveLength(6)
        expect(elements.filter(isObjectType)).toHaveLength(2)
        expect(elements.filter(isInstanceElement)).toHaveLength(4)
        expect(elements.map(e => e.elemID.getFullName()).sort()).toEqual([
          'zendesk_support.group',
          'zendesk_support.group.instance.Support',
          'zendesk_support.group.instance.Support2',
          'zendesk_support.group.instance.Support4',
          'zendesk_support.group.instance.Support5',
          'zendesk_support.groups',
        ])
      })
    })
  })

  describe('deploy', () => {
    let operations: AdapterOperations
    const groupType = new ObjectType({ elemID: new ElemID(ZENDESK_SUPPORT, 'group') })
    const brandType = new ObjectType({ elemID: new ElemID(ZENDESK_SUPPORT, 'brand') })
    const anotherType = new ObjectType({ elemID: new ElemID(ZENDESK_SUPPORT, 'anotherType') })
    beforeEach(() => {
      mockDeployChange.mockImplementation(async change => {
        if (isRemovalChange(change)) {
          throw new Error('some error')
        }
        if (getChangeData<InstanceElement>(change).elemID.typeName === 'group') {
          return { group: { id: 1 } }
        }
        if (getChangeData<InstanceElement>(change).elemID.typeName === 'brand') {
          return { brand: { key: 2 } }
        }
        return { key: 2 }
      })
      operations = adapter.operations({
        credentials: new InstanceElement(
          'config',
          usernamePasswordCredentialsType,
          { username: 'user123', password: 'pwd456', subdomain: 'abc' },
        ),
        config: new InstanceElement(
          'config',
          configType,
          {
            [FETCH_CONFIG]: {
              includeTypes: ['group', 'groups', 'brand', 'brands'],
            },
            [API_DEFINITIONS_CONFIG]: {
              types: {
                group: {
                  deployRequests: {
                    add: {
                      url: '/groups',
                      deployAsField: 'group',
                      method: 'post',
                    },
                    modify: {
                      url: '/groups/{groupId}',
                      method: 'put',
                      deployAsField: 'group',
                      urlParamsToFields: {
                        groupId: 'id',
                      },
                    },
                    remove: {
                      url: '/groups/{groupId}',
                      method: 'delete',
                      deployAsField: 'group',
                      urlParamsToFields: {
                        groupId: 'id',
                      },
                    },
                  },
                },
                brand: {
                  transformation: {
                    serviceIdField: 'key',
                  },
                  deployRequests: {
                    add: {
                      url: '/brands',
                      method: 'post',
                    },
                  },
                },
                anotherType: {
                  transformation: {
                    serviceIdField: 'key',
                  },
                  deployRequests: {
                    add: {
                      url: '/anotherType',
                      method: 'post',
                    },
                  },
                },
                groups: {
                  request: {
                    url: '/groups',
                  },
                  transformation: {
                    dataField: 'groups',
                  },
                },
                brands: {
                  request: {
                    url: '/brands',
                  },
                  transformation: {
                    dataField: 'brands',
                  },
                },
              },
            },
          }
        ),
        elementsSource: buildElementsSourceFromElements([]),
      })
    })

    it('should return the applied changes', async () => {
      const ref = new ReferenceExpression(
        new ElemID(ZENDESK_SUPPORT, 'test', 'instance', 'ins'),
        { externalId: 5 },
      )
      const modificationChange = toChange({
        before: new InstanceElement('inst4', brandType, { externalId: 4 }),
        after: new InstanceElement('inst4', brandType, { externalId: 5 }),
      })
      const deployRes = await operations.deploy({
        changeGroup: {
          groupID: 'group',
          changes: [
            toChange({ after: new InstanceElement('inst', groupType) }),
            toChange({ before: new InstanceElement('inst2', groupType) }),
            toChange({ after: new InstanceElement('inst3', brandType, { ref }) }),
            toChange({ after: new InstanceElement('inst4', anotherType) }),
            modificationChange,
          ],
        },
      })

      expect(deployRes.appliedChanges).toEqual([
        toChange({ after: new InstanceElement('inst', groupType, { id: 1 }) }),
        toChange({ after: new InstanceElement('inst3', brandType, { key: 2, ref: expect.any(ReferenceExpression) }) }),
        toChange({ after: new InstanceElement('inst4', anotherType, { key: 2 }) }),
        modificationChange,
      ])
    })

    it('should return the errors', async () => {
      const deployRes = await operations.deploy({
        changeGroup: {
          groupID: 'group',
          changes: [
            toChange({ after: new InstanceElement('inst', groupType) }),
            toChange({ before: new InstanceElement('inst2', groupType) }),
          ],
        },
      })

      expect(deployRes.errors).toEqual([
        new Error('some error'),
      ])
    })
    it('should have change validator', () => {
      expect(operations.deployModifiers?.changeValidator).toBeDefined()
    })
    it('should not update id if deployChange result is an array', async () => {
      mockDeployChange.mockImplementation(async () => [{ id: 2 }])
      const deployRes = await operations.deploy({
        changeGroup: {
          groupID: 'group',
          changes: [
            toChange({ after: new InstanceElement('inst', groupType) }),
          ],
        },
      })
      expect(deployRes.appliedChanges).toEqual([
        toChange({ after: new InstanceElement('inst', groupType) }),
      ])
    })
    it('should not update id if the response is primitive', async () => {
      mockDeployChange.mockImplementation(async () => 2)
      const deployRes = await operations.deploy({
        changeGroup: {
          groupID: 'group',
          changes: [
            toChange({ after: new InstanceElement('inst', groupType) }),
          ],
        },
      })
      expect(deployRes.appliedChanges).toEqual([
        toChange({ after: new InstanceElement('inst', groupType) }),
      ])
    })
    it('should not update id field if it does not exist in the response', async () => {
      mockDeployChange.mockImplementation(async () => ({ test: 2 }))
      const deployRes = await operations.deploy({
        changeGroup: {
          groupID: 'group',
          changes: [
            toChange({ after: new InstanceElement('inst', groupType) }),
          ],
        },
      })
      expect(deployRes.appliedChanges).toEqual([
        toChange({ after: new InstanceElement('inst', groupType) }),
      ])
    })
  })
})
