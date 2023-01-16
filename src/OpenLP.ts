type ApiItem = {
  ccli_number: string,
  id: string,
  is_valid: boolean,
  notes: string,
  plugin: string,
  selected: boolean,
  title: string
}

type ApiLiveItem = {
  title: string
  slides: {
      tag: string,
      title: string,
      selected: boolean,
      text: string,
      html: string,
      chords: string,
      footer: string
  }[]
  id: string
}
export class OpenLP extends EventTarget {
  private socket: WebSocket
  private api: OpenLPApi
  private counter = 0
  private liveItem!: ApiLiveItem
  items!: OpenLPItem[]
  slides!: OpenLPSlide[]

  private constructor (fetch: Window['fetch'], olpBase: string) {
    super()

    const olpUrl = new URL(olpBase)
    const wsProtocol = { 'http:': 'ws:', 'https:': 'wss:' }[olpUrl.protocol]
    if (!wsProtocol) throw new Error(`Unknown protocol ${olpUrl.protocol}`)

    this.socket = new WebSocket(`${wsProtocol}//${olpUrl.hostname}:${Number(olpUrl.port) + 1}`)
    this.api = new OpenLPApi(fetch, `${olpUrl.origin}/api/v2/`)

    this.socket.addEventListener('message', async ({ data }) => {
      if (data.counter <= this.counter) return
      this.counter = data.counter

      if (this.liveItem?.id !== data.item) {
        this.fetchItems()
      }
      this.fetchLiveItem()
    })
  }

  static async new (fetch: Window['fetch'], olpBase: string) {
    const olp = new this(fetch, olpBase)
    await Promise.all([
      olp.fetchItems(),
      olp.fetchLiveItem()
    ])
    return olp
  }

  private async fetchItems () {
    this.items = (await this.api.get('service/items'))
      .map((apiItem: ApiItem) => new OpenLPItem(this.api, apiItem))
    const event = new Event('itemsUpdated')
    this.dispatchEvent(event)
  }

  private async fetchLiveItem () {
    this.liveItem = await this.api.get('controller/live-items')
    this.slides = this.liveItem.slides.map((apiSlide, i) => {
      return new OpenLPSlide(this.api, apiSlide, i)
    })
    const event = new Event('liveItemUpdated')
    this.dispatchEvent(event)
  }
}

class OpenLPApi {
  private fetch: Window['fetch']
  private apiBase: string

  constructor (fetch: Window['fetch'], apiBase: string) {
    this.fetch = fetch
    this.apiBase = apiBase
  }

  async get (path: string) {
    const response = await this.fetch(this.apiBase + path)
    const data = await response.json()
    return data
  }

  async post (path: string, body: any) {
    await this.fetch(this.apiBase + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }
}

class OpenLPItem {
  private api: OpenLPApi

  id: string
  title: string
  selected: boolean

  constructor(api: OpenLPApi, apiItem: ApiItem) {
    this.api = api

    this.id = apiItem.id
    this.title = apiItem.title
    this.selected = apiItem.selected
  }

  async select () {
    await this.api.post('service/show', { id: this.id })
  }
}

export type { OpenLPItem }

class OpenLPSlide {
  private api: OpenLPApi
  private index: number

  text: string
  selected: boolean

  constructor(api: OpenLPApi, apiSlide: ApiLiveItem['slides'][0], index: number) {
    this.api = api
    this.index = index
    
    this.text = apiSlide.text
    this.selected = apiSlide.selected
  }

  async select () {
    await this.api.post('controller/show', { id: this.index })
  }
}

export type { OpenLPSlide }