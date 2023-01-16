<div class="slide-container">
  <section class="section">
    <h1 class="title is-2">
      <span class="icon" style="vertical-align: middle; width: 1.5em;">
        <img src="/favicon.png" alt="Power Remote Icon">
      </span>
      <span style="vertical-align: middle;">Power Remote for OpenLP</span>
    </h1>
    {#if data.items && data.slides}
      <div class="columns">
        <div class="column">
          <h2 class="title is-3">Slides</h2>
          <div class="columns is-multiline">
            {#each data.slides as slide}
              <div class="column slide-column">
                <div class="box slide-box" on:click="{() => slide.slide.select()}" on:keydown="{() => slide.slide.select()}">
                  <p class="slide" class:selected="{slide.slide.selected}">
                    {#if slide.bind}<span class="tag">{slide.bind.display}</span> {/if}{slide.slide.text.split('\n').join(' / ')}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="column is-narrow">
          <h2 class="title is-3">Items</h2>
          <ol>
            {#each data.items as item}
              <li>
                <button class="button item-button" class:selected="{item.item.selected}" on:click="{() => item.item.select()}">
                  {#if item.bind}
                    <span class="tag">{item.bind.display}</span>
                  {/if}
                  <span>{item.item.title}</span>
                </button>
              </li>
            {/each}
          </ol>
        </div>
      </div>
    {:else if data.failedToConnect}
      <h2 class="title is-3">Remote URL</h2>
      <p>
        {#if data.nondefaultRemote}Failed to connect to {data.nondefaultRemote}. {/if}
        Put the "Remote URL" from OpenLP's configuration window in this box:
      </p>
      <form on:submit="{(event) => { event.preventDefault(); setRemote() } }">
        <div class="field has-addons">
          <div class="control">
            <input class="input" type="text" name="url" id="remote-url-input" placeholder="Remote URL">
          </div>
          <div class="control">
            <input class="button is-primary" type="submit" value="Connect">
          </div>
        </div>
      </form>
    {:else}
      <p>Power Remote is attempting to connect to OpenLP, please wait.</p>
    {/if}
  </section>
</div>

<style>
  h1 {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .slide-column {
    max-height: 10em;
  }
  @media screen and (min-width: 769px) {
    .slide-column {
      min-width: 5em;
      width: 25%;
      max-width: fit-content;
      flex: none;
    }
  }
  .slide-box {
    height: 100%;
    display: grid;
    grid-template-rows: repeat(1, auto);
  }

  .slide {
    white-space: pre-wrap;
    overflow: hidden;
  }

  .selected {
    color: #f14668;
  }

  ol {
    list-style: none;
  }

  li {
    padding-bottom: .5em;
  }

  .item-button {
    user-select: none;
  }

  .item-button .tag {
    margin-right: .5em;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte'

  import { OpenLP, type OpenLPItem, type OpenLPSlide } from '../OpenLP.js'
  import { Keybind } from '../Keybind.js'

  const data = {} as {
    items?: {
      item: OpenLPItem
      bind: Keybind
    }[]
    slides?: {
      slide: OpenLPSlide
      bind: Keybind
    }[],
    failedToConnect?: true
    nondefaultRemote?: string
  }

  export { data }

  function setRemote () {
    const remoteUrl = (document.querySelector('#remote-url-input') as HTMLInputElement).value
    init(remoteUrl)
  }

  async function init (remoteUrlFormOption?: string) {
    if (!globalThis.addEventListener) return

    data.failedToConnect = undefined

    const DEFAULT_OPENLP_REMOTE_URL = 'http://localhost:4316'
    const urlParams = new URLSearchParams(window.location.search)
    const remoteUrlQueryParam = urlParams.get('remote')

    let selectedRemote = remoteUrlFormOption ?? remoteUrlQueryParam ?? DEFAULT_OPENLP_REMOTE_URL
    if (!selectedRemote.startsWith('http://') && !selectedRemote.startsWith('https://')) selectedRemote = `http://${selectedRemote}`
    if (selectedRemote !== DEFAULT_OPENLP_REMOTE_URL) data.nondefaultRemote = selectedRemote

    let olp: OpenLP
    try {
      olp = await OpenLP.new(fetch, selectedRemote)
    } catch {
      data.failedToConnect = true
      return
    }

    const ITEM_KEYBINDS = [
      new Keybind('Digit1', '1'),
      new Keybind('Digit2', '2'),
      new Keybind('Digit3', '3'),
      new Keybind('Digit4', '4'),
      new Keybind('Digit5', '5'),
      new Keybind('Digit6', '6'),
      new Keybind('Digit7', '7'),
      new Keybind('Digit8', '8'),
      new Keybind('Digit9', '9'),
      new Keybind('Digit0', '0'),
      new Keybind('Minus', '-'),
      new Keybind('Equal', '=')
    ]

    function updateItems () {
      data.items = olp.items.map((item, i) => {
        return { item, bind: ITEM_KEYBINDS[i] }
      })
    }
    olp.addEventListener('itemsUpdated', updateItems)
    updateItems()

    globalThis.addEventListener('keydown', async (event) => {
      const item = data.items?.find(item => item.bind?.code === event.code)
      if (!item) return
      event.preventDefault()
      await item.item.select()
    })

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
      data.slides = olp.slides.map((slide, i) => {
        return {
          slide,
          bind: SLIDE_KEYBINDS[i]
        }
      })
    }
    olp.addEventListener('liveItemUpdated', updateLiveItem)
    updateLiveItem()

    globalThis.addEventListener('keydown', async (event) => {
      const slide = data.slides?.find(slide => slide.bind.code === event.code)
      if (!slide) return
      event.preventDefault()
      await slide.slide.select()
    })
  }

  onMount(init)
</script>