export class OpenLP extends EventTarget {
  private socket: WebSocket
  private apiBase: string
  private fetch: Window['fetch']
  liveItem!: {
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

  private constructor (fetch: Window['fetch'], olpBase: string) {
    super()

    this.fetch = fetch

    const olpUrl = new URL(olpBase)
    const wsProtocol = { 'http:': 'ws:', 'https:': 'wss:' }[olpUrl.protocol]
    if (!wsProtocol) throw new Error(`Unknown protocol ${olpUrl.protocol}`)

    this.socket = new WebSocket(`${wsProtocol}//${olpUrl.hostname}:${Number(olpUrl.port) + 1}`)
    this.apiBase = `${olpUrl.origin}/api/v2/`

    this.socket.addEventListener('message', async () => {
      await this.refetchLiveItems()
      console.log(this)
    })
  }

  static async new (fetch: Window['fetch'], olpBase: string) {
    const olp = new this(fetch, olpBase)
    await olp.refetchLiveItems()
    return olp
  }

  async setSlide (index: number) {
    this.apiPost('controller/show', { id: index })
  }

  private async refetchLiveItems () {
    this.liveItem = await this.apiGet('controller/live-items')
    const event = new Event('liveItemUpdated')
    this.dispatchEvent(event)
  }

  private async apiGet (path: string) {
    const response = await this.fetch(this.apiBase + path)
    const data = await response.json()
    return data
  }

  private async apiPost (path: string, body: any) {
    await this.fetch(this.apiBase + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }
}
