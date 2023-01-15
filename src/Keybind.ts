export class Keybind {
  code: string
  display: string

  constructor (code: string, defaultDisplay: string) {
    this.code = code
    this.display = defaultDisplay
    this.updateDisplayIfSupported()
  }

  async updateDisplayIfSupported () {
    try {
      if (!navigator.keyboard) throw new Error('navigator.keyboard unsupported')
      const layout = await navigator.keyboard.getLayoutMap()
      this.display = layout.get(this.code)
    } catch {
      // do nothing
    }
  }
}
