type KeyboardLayoutMap = {
  get: (key: string) => string
}
declare global {
  namespace App {}

  interface Navigator {
    keyboard?: {
      getLayoutMap: () => Promise<KeyboardLayoutMap>
    }
  }
}

export {}
