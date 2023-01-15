<div class="slide-container">
    <ul>
        {#if data.liveItem}
            {#each data.liveItem.slides as slide}
                <li class="slide" class:slide-selected="{slide.selected}"><pre>[{slide.bind}] {slide.text}</pre></li>
            {/each}
        {/if}
    </ul>
</div>

<style>
    .slide > pre {
        margin: 0 0 0 0;
    }
    .slide-selected {
        color: red;
    }
</style>

<script lang="ts">
  import { onMount } from 'svelte'

  import { OpenLP } from '../OpenLP.js'
  import { Keybind } from '../Keybind.js'

  const data = {} as {
    olp?: OpenLP,
    liveItem?: OpenLP['liveItem'] & {
      slides: {
        bind?: string
      }[]
    }
}
  export { data }

  onMount(async () => {
    const output = { data: {} }
    if (!globalThis.addEventListener) return output

    const DEFAULT_OPENLP_REMOTE_URL = 'http://localhost:4316'
    const olp = await OpenLP.new(fetch, DEFAULT_OPENLP_REMOTE_URL)
    data.olp = olp

    const SLIDE_KEYBINDS = [
      new Keybind('KeyA', 'A'),
      new Keybind('KeyS', 'S'),
      new Keybind('KeyD', 'D'),
      new Keybind('KeyF', 'F'),
      new Keybind('KeyG', 'G'),
      new Keybind('KeyH', 'H'),
      new Keybind('KeyJ', 'J'),
      new Keybind('KeyK', 'K'),
      new Keybind('KeyL', 'L'),
      new Keybind('Semicolon', ';'),
      new Keybind('Quote', "'"),
      new Keybind('KeyZ', 'Z'),
      new Keybind('KeyX', 'X'),
      new Keybind('KeyC', 'C'),
      new Keybind('KeyV', 'V'),
      new Keybind('KeyB', 'B'),
      new Keybind('KeyN', 'N'),
      new Keybind('KeyM', 'M')
    ]

    function updateLiveItem () {
      data.liveItem = JSON.parse(JSON.stringify(olp.liveItem)) as typeof olp.liveItem
      for (let i = 0; i < SLIDE_KEYBINDS.length && i < data.liveItem.slides.length; i++) {
        const bind = SLIDE_KEYBINDS[i]
        const slide = data.liveItem.slides[i]
        slide.bind = bind.display
      }
    }
    olp.addEventListener('liveItemUpdated', updateLiveItem)
    updateLiveItem()

    globalThis.addEventListener('keydown', async (event) => {
      const slideIndex = SLIDE_KEYBINDS.findIndex(bind => bind.code === event.code)
      if (slideIndex === -1) return
      event.preventDefault()
      await olp.setSlide(slideIndex)
    })

    return output
  })
</script>