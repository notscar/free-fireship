import {JSDOM} from "jsdom";
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as child_process from "child_process";

class Video {
    constructor(id, type) {
        this.id = id;
        this.type = type;
    }

    async resolveVimeo() {
        if (this.type !== "vimeo") {
            return;
        }

        const request = await fetch(`https://player.vimeo.com/video/${this.id}`, {
            headers: {
                "Referer": "https://fireship.io",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            }
        })

        const body = await request.text();


        const dom = new JSDOM(body);
        const scripts = dom.window.document.querySelectorAll("script");
        const scriptsContent = Array.from(scripts).map(scriptElement => scriptElement.textContent);
        const script = scriptsContent.find(scriptContent => scriptContent.startsWith("window.playerConfig"));

        const data = JSON.parse(script.replace("window.playerConfig = ", ""));

        return data.request.files["hls"]["cdns"]["akfire_interconnect_quic"]["avc_url"];
    }

    async download(path) {
        if (this.type !== "vimeo") {
            return;
        }

        const url = await this.resolveVimeo();
        child_process.execSync(`${ffmpegPath.path} -i "${url}" -c copy "${path}"`, {stdio: 'pipe'})
    }

    async getUrl() {
        if (this.type === "youtube") {
            return `https://www.youtube.com/watch?v=${this.id}`;
        }

        if (this.type === "video") {
            return this.id;
        }

        if (this.type === "vimeo") {
            return await this.resolveVimeo();
        }
    }
}

export default Video;