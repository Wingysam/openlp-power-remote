const HTTP_TIMEOUT = 5000

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

type ApiSongSearchResult = [number, string, string]

export class OpenLP extends EventTarget {
  private olpUrl: URL
  private socket!: WebSocket
  private api: OpenLPApi
  private counter = 0
  private liveItem!: ApiLiveItem
  items!: OpenLPItem[]
  slides!: OpenLPSlide[]

  private constructor (fetch: Window['fetch'], olpBase: string) {
    super()

    this.olpUrl = new URL(olpBase)
    this.api = new OpenLPApi(fetch, `${this.olpUrl.origin}/api/v2/`)
  }

  static async new (fetch: Window['fetch'], olpBase: string) {
    const olp = new this(fetch, olpBase)
    await Promise.all([
      olp.fetchItems(),
      olp.fetchLiveItem()
    ])
    olp.initializeWebSocket()
    return olp
  }

  async setDisplay (display: 'blank' | 'theme' | 'desktop' | 'show') {
    await this.api.post('core/display', { display })
  }

  async sendAlert (text: string) {
    await this.api.post('plugins/alerts', { text })
  }

  async searchSongs (query: string): Promise<SongSearchResult[]> {
    const songs = await this.api.get(`plugins/songs/search`, { text: query })
    return songs
      .map((apiSongSearchResult: ApiSongSearchResult) => {
        return new SongSearchResult(this.api, apiSongSearchResult)
      })
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

  private initializeWebSocket () {
    const wsProtocol = { 'http:': 'ws:', 'https:': 'wss:' }[this.olpUrl.protocol]
    if (!wsProtocol) throw new Error(`Unknown protocol ${this.olpUrl.protocol}`)

    this.socket = new WebSocket(`${wsProtocol}//${this.olpUrl.hostname}:${Number(this.olpUrl.port) + 1}`)
    this.socket.addEventListener('message', async ({ data }) => {
      if (data.counter <= this.counter) return
      this.counter = data.counter

      if (this.liveItem?.id !== data.item) {
        this.fetchItems()
      }
      this.fetchLiveItem()
    })
  }
}

class OpenLPApi {
  private fetch: Window['fetch']
  private apiBase: string

  constructor (fetch: Window['fetch'], apiBase: string) {
    this.fetch = fetch
    this.apiBase = apiBase
  }

  async get (path: string, queryOptions?: any) {
    const querystring = await this.buildQuerystring(queryOptions)
    const response = await this.http(this.apiBase + path + querystring)
    const data = await response.json()
    return data
  }

  async post (path: string, body: any) {
    await this.http(this.apiBase + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }

  private async http (url: string, options: any = {}) {
    const abortController = new AbortController()
    setTimeout(() => abortController.abort(), HTTP_TIMEOUT)
    return this.fetch(url, {
      ...options,
      signal: abortController.signal
    })
  }

  private async buildQuerystring(values: any) {
    let querystring = ''

    if (typeof values !== 'object') return ''

    let is_first_value = true
    for (const [key, value] of Object.entries(values)) {
      if (is_first_value) {
        querystring += '?'
      } else {
        querystring += '&'
      }
      is_first_value = false

      querystring += `${encodeURIComponent(key)}=${encodeURIComponent(value as any)}`
    }

    return querystring
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

class SongSearchResult {
  private api: OpenLPApi

  id: number
  title: string

  constructor (api: OpenLPApi, apiSongSearchResult: ApiSongSearchResult) {
    this.api = api
    this.id = apiSongSearchResult[0]
    this.title = apiSongSearchResult[1]
  }

  async sendLive () {
    this.api.post('plugins/songs/live', { id: this.id })
  }
}

export type { OpenLPSlide }