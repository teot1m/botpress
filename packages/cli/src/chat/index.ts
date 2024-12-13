import * as chat from '@botpress/chat'
import * as readline from 'readline'
import * as uuid from 'uuid'
import * as utils from '../utils'

export type ChatProps = {
  client: chat.AuthenticatedClient
  conversationId: string
}

export type ChatState =
  | {
      status: 'stopped'
    }
  | {
      status: 'running'
      messages: chat.Message[]
      connection: chat.SignalListener
      keyboard: readline.Interface
    }

export class Chat {
  private _events = new utils.emitter.EventEmitter<{ state: ChatState }>()
  private _state: ChatState = { status: 'stopped' }

  public static launch(props: ChatProps): Chat {
    const instance = new Chat(props)
    void instance._run()
    return instance
  }

  private constructor(private _props: ChatProps) {}

  private async _run() {
    this._switchAlternateScreenBuffer()
    this._events.on('state', this._renderMessages)

    const connection = await this._props.client.listenConversation({ id: this._props.conversationId })
    const keyboard = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    connection.on('message_created', (m) => void this._onMessageReceived(m))
    keyboard.on('line', (l) => void this._onKeyboardInput(l))
    process.stdin.on('keypress', (_, key) => {
      if (key.name === 'escape') {
        void this._onExit()
      }
    })

    this._setState({ status: 'running', messages: [], connection, keyboard })
  }

  private _setState = (newState: ChatState) => {
    this._state = newState
    this._events.emit('state', this._state)
  }

  private _onMessageReceived = async (message: chat.Message) => {
    if (this._state.status === 'stopped') {
      return
    }
    if (message.userId === this._props.client.user.id) {
      return
    }
    this._setState({ ...this._state, messages: [...this._state.messages, message] })
  }

  private _onKeyboardInput = async (line: string) => {
    if (this._state.status === 'stopped') {
      return
    }

    if (line === 'exit') {
      await this._onExit()
      return
    }

    if (!line) {
      this._setState({ ...this._state })
      return
    }

    const message = this._textToMessage(line)
    this._setState({ ...this._state, messages: [...this._state.messages, message] })
    await this._props.client.createMessage(message)
  }

  private _onExit = async () => {
    if (this._state.status === 'stopped') {
      return
    }
    const { connection, keyboard } = this._state
    await connection.disconnect()
    connection.cleanup()
    keyboard.close()
    this._setState({ status: 'stopped' })
    this._clearStdOut()
    this._restoreOriginalScreenBuffer()
  }

  public wait(): Promise<void> {
    return new Promise<void>((resolve) => {
      const cb = (state: ChatState) => {
        if (state.status === 'stopped') {
          this._events.off('state', cb)
          resolve()
        }
      }
      this._events.on('state', cb)
    })
  }

  private _renderMessages = () => {
    if (this._state.status === 'stopped') {
      return
    }

    this._clearStdOut()
    for (const message of this._state.messages) {
      process.stdout.write(`[${message.userId}] ${this._messageToText(message)}\n`)
    }

    this._state.keyboard.setPrompt('>> ')
    this._state.keyboard.prompt(true) // Redisplay the prompt and maintain current input
  }

  private _switchAlternateScreenBuffer = () => {
    process.stdout.write('\x1B[?1049h')
  }

  private _restoreOriginalScreenBuffer = () => {
    process.stdout.write('\x1B[?1049l')
  }

  private _clearStdOut = () => {
    process.stdout.write('\x1B[2J\x1B[0;0H')
  }

  private _messageToText = (message: chat.Message): string => {
    switch (message.payload.type) {
      case 'audio':
        return message.payload.audioUrl
      case 'card':
        return '<card>' // TODO: implement something better
      case 'carousel':
        return '<carousel>' // TODO: implement something better
      case 'choice':
        return [message.payload.text, ...message.payload.options.map((o) => `  - ${o.label} (${o.value})`)].join('\n')
      case 'dropdown':
        return [message.payload.text, ...message.payload.options.map((o) => `  - ${o.label} (${o.value})`)].join('\n')
      case 'file':
        return message.payload.fileUrl
      case 'image':
        return message.payload.imageUrl
      case 'location':
        return `${message.payload.latitude},${message.payload.longitude} (${message.payload.address})`
      case 'text':
        return message.payload.text
      case 'video':
        return message.payload.videoUrl
      case 'markdown':
        return message.payload.markdown
      default:
        type _assertion = utils.types.AssertNever<typeof message.payload>
        return '<unknown>'
    }
  }

  private _textToMessage = (text: string): chat.Message => {
    return {
      id: uuid.v4(),
      userId: this._props.client.user.id,
      conversationId: this._props.conversationId,
      createdAt: new Date().toISOString(),
      payload: { type: 'text', text },
    }
  }
}
