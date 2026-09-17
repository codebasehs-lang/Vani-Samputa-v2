// Registry that lets a page (e.g. the video watch page) "dock" the shared,
// always-running video player into its own layout instead of the global
// floating bubble. The player itself is never destroyed/recreated when the
// dock target changes — only the DOM node holding it gets reparented — so
// switching between the full page and the floating/PiP view never restarts
// playback or loses position.
type DockListener = () => void
type DockSnapshot = { element: HTMLElement | null; trackId: string | null }

let dockElement: HTMLElement | null = null
let dockTrackId: string | null = null
// Cached so useSyncExternalStore's snapshot reference stays stable between
// notifications — returning a fresh object on every call would trigger
// "getServerSnapshot should be cached" / infinite render loops.
let snapshot: DockSnapshot = { element: null, trackId: null }
const listeners = new Set<DockListener>()

function notify() {
  snapshot = { element: dockElement, trackId: dockTrackId }
  listeners.forEach((listener) => listener())
}

/** Registers `el` as the docking target for `trackId`. Call the returned function to unregister. */
export function registerVideoDock(el: HTMLElement, trackId: string) {
  dockElement = el
  dockTrackId = trackId
  notify()
  return () => {
    if (dockElement === el) {
      dockElement = null
      dockTrackId = null
      notify()
    }
  }
}

export function getVideoDockSnapshot() {
  return snapshot
}

export function subscribeVideoDock(listener: DockListener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

// Document Picture-in-Picture request bridge: the "PiP" button (rendered on
// the video watch page) doesn't own the player instance, so it asks the
// global VideoStage to perform the actual request via this pub/sub.
type PiPRequestListener = () => void
const pipRequestListeners = new Set<PiPRequestListener>()

export function requestDocumentPiP() {
  pipRequestListeners.forEach((listener) => listener())
}

export function onDocumentPiPRequest(listener: PiPRequestListener) {
  pipRequestListeners.add(listener)
  return () => { pipRequestListeners.delete(listener) }
}

export function isDocumentPiPSupported() {
  return typeof window !== "undefined" && "documentPictureInPicture" in window
}
