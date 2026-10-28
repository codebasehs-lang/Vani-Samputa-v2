const bucketOrigin = "https://vani-samputa-audio-development.zohostratus.in"
const objectPrefix = "HH Haladhara Swami Maharaj/"

function audioUrl(filename: string) {
    return new URL(`${objectPrefix}${filename}`, `${bucketOrigin}/`).href
}

export const zohoAudioImportSampleRows = [
    {
        Title: "Introduction to Chapter Three",
        URL: audioUrl("0001 BG 03-01 - Introduction to Chapter Three - 2022-02-15.mp3"),
        "Media Type": "AUDIO",
        Language: "English",
        Categories: "Bhagavad Gita",
        Playlist: "",
        Duration: "01:06:44",
        "Lecture Date": "2022-02-15",
    },
    {
        Title: "Europe Tour - Belgium",
        URL: audioUrl("0003 Europe Tour-01-Belgium.mp3"),
        "Media Type": "AUDIO",
        Language: "English",
        Categories: "General",
        Playlist: "Europe Tour",
        Duration: "",
        "Lecture Date": "",
    },
    {
        Title: "Europe Tour - France",
        URL: audioUrl("0004 Europe Tour-02-France.mp3"),
        "Media Type": "AUDIO",
        Language: "English",
        Categories: "General",
        Playlist: "Europe Tour",
        Duration: "",
        "Lecture Date": "",
    },
]
