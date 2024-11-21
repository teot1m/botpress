import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../../integration/types/generic'
import { BaseInterface, DefaultInterface, InputBaseInterface } from '../../interface/generic'
import * as utils from '../../utils/type-utils'

export * from '../../integration/types/generic'

export type BaseAction = {
  input: any
  output: any
}

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  interfaces: Record<string, BaseInterface>
  events: Record<string, any>
  states: Record<string, any>
  actions: Record<string, BaseAction>
}

export type DefaultBot<B extends utils.DeepPartial<BaseBot>> = {
  events: utils.Default<B['events'], BaseBot['events']>
  states: utils.Default<B['states'], BaseBot['states']>
  actions: utils.Default<B['actions'], BaseBot['actions']>
  integrations: undefined extends B['integrations']
    ? BaseBot['integrations']
    : {
        [K in keyof B['integrations']]: DefaultIntegration<utils.Cast<B['integrations'][K], InputBaseIntegration>>
      }
  interfaces: undefined extends B['interfaces']
    ? BaseBot['interfaces']
    : {
        [K in keyof B['interfaces']]: DefaultInterface<utils.Cast<B['interfaces'][K], InputBaseInterface>>
      }
}
