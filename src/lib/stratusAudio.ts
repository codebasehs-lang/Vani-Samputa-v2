export function getStratusAudioSource(value: string, bucketOriginValue: string) {
    try {
        const source = new URL(value)
        const bucket = new URL(bucketOriginValue)
        if (
            bucket.protocol !== "https:"
            || bucket.pathname !== "/"
            || bucket.search
            || bucket.hash
            || bucket.username
            || bucket.password
            || source.protocol !== "https:"
            || source.origin !== bucket.origin
            || source.username
            || source.password
            || source.search
            || source.hash
            || source.pathname.startsWith("/_signed/")
        ) return null

        const segments = source.pathname.slice(1).split("/").map(decodeURIComponent)
        if (segments.some((segment) => (
            !segment
            || segment === "."
            || segment === ".."
            || /[\u0000-\u001f\u007f\\/?#]/.test(segment)
        ))) return null

        return { url: source.href, objectKey: segments.join("/") }
    } catch {
        return null
    }
}
