import * as client from '@botpress/client'
import * as bot from '../../bot'
import * as utils from '../../utils/type-utils'
import * as types from '../types'

export type PluginOperation = 'event_received' | 'register' | 'unregister' | 'ping' | 'action_triggered'
export type PluginContext = {
  botId: string
  type: string
  operation: PluginOperation
  configuration: {
    payload: string
  }
}

type _IncomingEvents<TPlugin extends types.BasePlugin> = {
  [K in keyof bot.EnumerateEvents<TPlugin>]: utils.Merge<
    client.Event,
    { type: K; payload: bot.EnumerateEvents<TPlugin>[K] }
  >
}

type _IncomingMessages<TPlugin extends types.BasePlugin> = {
  // TODO: use bot definiton message property to infer allowed tags
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    //
    client.Message,
    { type: K; payload: bot.GetMessages<TPlugin>[K] }
  >
}

type _OutgoingMessageRequests<TPlugin extends types.BasePlugin> = {
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: bot.GetMessages<TPlugin>[K] }
  >
}

type _OutgoingMessageResponses<TPlugin extends types.BasePlugin> = {
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: bot.GetMessages<TPlugin>[K] }>
    }
  >
}

type _OutgoingCallActionRequests<TPlugin extends types.BasePlugin> = {
  [K in keyof bot.EnumerateActionInputs<TPlugin>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: bot.EnumerateActionInputs<TPlugin>[K] }
  >
}

type _OutgoingCallActionResponses<TPlugin extends types.BasePlugin> = {
  [K in keyof bot.EnumerateActionOutputs<TPlugin>]: utils.Merge<
    client.ClientOutputs['callAction'],
    { output: bot.EnumerateActionOutputs<TPlugin>[K] }
  >
}

export type AnyIncomingEvent<_TPlugin extends types.BasePlugin> = client.Event
export type AnyIncomingMessage<_TPlugin extends types.BasePlugin> = client.Message
export type AnyOutgoingMessageRequest<_TPlugin extends types.BasePlugin> = client.ClientInputs['createMessage']
export type AnyOutgoingMessageResponse<_TPlugin extends types.BasePlugin> = client.ClientOutputs['createMessage']
export type AnyOutgoingCallActionRequest<_TPlugin extends types.BasePlugin> = client.ClientInputs['callAction']
export type AnyOutgoingCallActionResponse<_TPlugin extends types.BasePlugin> = client.ClientOutputs['callAction']

export type IncomingEvents<TPlugin extends types.BasePlugin> = _IncomingEvents<TPlugin> & {
  '*': AnyIncomingEvent<TPlugin>
}
export type IncomingMessages<TPlugin extends types.BasePlugin> = _IncomingMessages<TPlugin> & {
  '*': AnyIncomingMessage<TPlugin>
}
export type IncomingStates<_TPlugin extends types.BasePlugin> = {
  '*': client.State
}
export type OutgoingMessageRequests<TPlugin extends types.BasePlugin> = _OutgoingMessageRequests<TPlugin> & {
  '*': AnyOutgoingMessageRequest<TPlugin>
}
export type OutgoingMessageResponses<TPlugin extends types.BasePlugin> = _OutgoingMessageResponses<TPlugin> & {
  '*': AnyOutgoingMessageResponse<TPlugin>
}
export type OutgoingCallActionRequests<TPlugin extends types.BasePlugin> = _OutgoingCallActionRequests<TPlugin> & {
  '*': AnyOutgoingCallActionRequest<TPlugin>
}
export type OutgoingCallActionResponses<TPlugin extends types.BasePlugin> = _OutgoingCallActionResponses<TPlugin> & {
  '*': AnyOutgoingCallActionResponse<TPlugin>
}

export type PluginClient<_TPlugin extends types.BasePlugin> = bot.BotSpecificClient<types.BasePlugin>

export type CommonHandlerProps<TPlugin extends types.BasePlugin> = {
  ctx: PluginContext
  logger: bot.BotLogger
  client: PluginClient<TPlugin>
}

export type MessagePayloads<TPlugin extends types.BasePlugin> = {
  [K in keyof IncomingMessages<TPlugin>]: {
    message: IncomingMessages<TPlugin>[K]
    user: client.User
    conversation: client.Conversation
    event: client.Event
    states: {
      [TState in keyof TPlugin['states']]: {
        type: 'user' | 'conversation' | 'bot'
        payload: TPlugin['states'][TState]
      }
    }
  }
}

export type MessageHandlers<TPlugin extends types.BasePlugin> = {
  [K in keyof IncomingMessages<TPlugin>]: (
    args: CommonHandlerProps<TPlugin> & MessagePayloads<TPlugin>[K]
  ) => Promise<void>
}

export type EventPayloads<TPlugin extends types.BasePlugin> = {
  [K in keyof IncomingEvents<TPlugin>]: { event: IncomingEvents<TPlugin>[K] }
}

export type EventHandlers<TPlugin extends types.BasePlugin> = {
  [K in keyof IncomingEvents<TPlugin>]: (args: CommonHandlerProps<TPlugin> & EventPayloads<TPlugin>[K]) => Promise<void>
}

export type StateExpiredPayloads<TPlugin extends types.BasePlugin> = {
  [K in keyof IncomingStates<TPlugin>]: { state: IncomingStates<TPlugin>[K] }
}

export type StateExpiredHandlers<TPlugin extends types.BasePlugin> = {
  [K in keyof IncomingStates<TPlugin>]: (
    args: CommonHandlerProps<TPlugin> & StateExpiredPayloads<TPlugin>[K]
  ) => Promise<void>
}

export type ActionHandlerPayloads<TPlugin extends types.BasePlugin> = {
  [K in keyof TPlugin['actions']]: { type?: K; input: TPlugin['actions'][K]['input'] }
}

export type ActionHandlers<TPlugin extends types.BasePlugin> = {
  [K in keyof TPlugin['actions']]: (
    props: CommonHandlerProps<TPlugin> & ActionHandlerPayloads<TPlugin>[K]
  ) => Promise<TPlugin['actions'][K]['output']>
}

type BaseHookDefinition = { stoppable?: boolean; data: any }
type HookDefinition<THookDef extends BaseHookDefinition = BaseHookDefinition> = THookDef

/**
 * TODO: add hooks for:
 *   - before_register
 *   - after_register
 *   - before_state_expired
 *   - after_state_expired
 *   - before_incoming_call_action
 *   - after_incoming_call_action
 */
export type HookDefinitions<TPlugin extends types.BasePlugin> = {
  before_incoming_event: HookDefinition<{
    stoppable: true
    data: _IncomingEvents<TPlugin> & { '*': AnyIncomingEvent<TPlugin> }
  }>
  before_incoming_message: HookDefinition<{
    stoppable: true
    data: _IncomingMessages<TPlugin> & { '*': AnyIncomingMessage<TPlugin> }
  }>
  before_outgoing_message: HookDefinition<{
    stoppable: false
    data: _OutgoingMessageRequests<TPlugin> & { '*': AnyOutgoingMessageRequest<TPlugin> }
  }>
  before_outgoing_call_action: HookDefinition<{
    stoppable: false
    data: _OutgoingCallActionRequests<TPlugin> & { '*': AnyOutgoingCallActionRequest<TPlugin> }
  }>
  after_incoming_event: HookDefinition<{
    stoppable: true
    data: _IncomingEvents<TPlugin> & { '*': AnyIncomingEvent<TPlugin> }
  }>
  after_incoming_message: HookDefinition<{
    stoppable: true
    data: _IncomingMessages<TPlugin> & { '*': AnyIncomingMessage<TPlugin> }
  }>
  after_outgoing_message: HookDefinition<{
    stoppable: false
    data: _OutgoingMessageResponses<TPlugin> & { '*': AnyOutgoingMessageResponse<TPlugin> }
  }>
  after_outgoing_call_action: HookDefinition<{
    stoppable: false
    data: _OutgoingCallActionResponses<TPlugin> & { '*': AnyOutgoingCallActionResponse<TPlugin> }
  }>
}

export type HookData<TPlugin extends types.BasePlugin> = {
  [H in keyof HookDefinitions<TPlugin>]: {
    [T in keyof HookDefinitions<TPlugin>[H]['data']]: HookDefinitions<TPlugin>[H]['data'][T]
  }
}

export type HookInputs<TPlugin extends types.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]: CommonHandlerProps<TPlugin> & {
      data: HookData<TPlugin>[H][T]
    }
  }
}

export type HookOutputs<TPlugin extends types.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]: {
      data?: HookData<TPlugin>[H][T]
    } & (HookDefinitions<TPlugin>[H]['stoppable'] extends true ? { stop?: boolean } : {})
  }
}

export type HookHandlers<TPlugin extends types.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]: (
      input: HookInputs<TPlugin>[H][T]
    ) => Promise<HookOutputs<TPlugin>[H][T] | undefined>
  }
}

export type MessageHandlersMap<TPlugin extends types.BasePlugin> = {
  [T in keyof IncomingMessages<TPlugin>]?: MessageHandlers<TPlugin>[T][]
}

export type EventHandlersMap<TPlugin extends types.BasePlugin> = {
  [T in keyof IncomingEvents<TPlugin>]?: EventHandlers<TPlugin>[T][]
}

export type StateExpiredHandlersMap<TPlugin extends types.BasePlugin> = {
  [T in keyof IncomingStates<TPlugin>]?: StateExpiredHandlers<TPlugin>[T][]
}

export type HookHandlersMap<TPlugin extends types.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]?: HookHandlers<TPlugin>[H][T][]
  }
}

export type PluginActionHandlers<TPlugin extends types.BasePlugin> = ActionHandlers<TPlugin>
export type PluginMessageHandlers<TPlugin extends types.BasePlugin> = MessageHandlersMap<TPlugin>
export type PluginEventHandlers<TPlugin extends types.BasePlugin> = EventHandlersMap<TPlugin>
export type PluginStateExpiredHandlers<TPlugin extends types.BasePlugin> = StateExpiredHandlersMap<TPlugin>
export type PluginHookHandlers<TPlugin extends types.BasePlugin> = HookHandlersMap<TPlugin>
export type PluginHandlers<TPlugin extends types.BasePlugin> = {
  actionHandlers: PluginActionHandlers<TPlugin>
  messageHandlers: PluginMessageHandlers<TPlugin>
  eventHandlers: PluginEventHandlers<TPlugin>
  stateExpiredHandlers: PluginStateExpiredHandlers<TPlugin>
  hookHandlers: PluginHookHandlers<TPlugin>
}
