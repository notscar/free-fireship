import parseMarkdown from 'parse-md'

class Scraper {
    constructor(basePath = "fireship-io/fireship.io", coursesPath = "content/courses") {
        this.basePath = basePath;
        this.coursesPath = coursesPath
    }

    async getRawCourseEpisode(courseName, episodeName) {
        const episodeUrl = `https://raw.githubusercontent.com/${this.basePath}/master/${this.coursesPath}/${courseName}/${episodeName}.md`;
        const request = await fetch(episodeUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        const {metadata} = parseMarkdown(await request.text());

        return metadata;
    }

    async getCourses() {
        const coursesUrl = `https://github.com/${this.basePath}/tree-commit-info/master/${this.coursesPath}`;
        const request = await fetch(coursesUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        const response = await request.json();

        return Object.keys(response).filter(c => !c.endsWith(".md"));
    }

    async getCourseEpisodes(courseName) {
        const episodesUrl = `https://github.com/${this.basePath}/tree-commit-info/master/${this.coursesPath}/${courseName}`;
        const request = await fetch(episodesUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        const response = await request.json();

        const episodesFiles = Object.keys(response)
            .filter(e => e.endsWith(".md") && e !== "_index.md")
            .map(e => e.replace(".md", ""));

        return (
            await Promise.all(
                episodesFiles.map(async e => {
                    const episode = await this.getRawCourseEpisode(courseName, e);
                    return {
                        name: episode.title,
                        emoji: episode.emoji || "?",
                        id: episode["vimeo"] ? episode["vimeo"] : episode["youtube"] ? episode["youtube"] : episode.video,
                        length: episode["video_length"] || "unknown",
                        order: episode.weight,
                        type: episode["vimeo"] ? "vimeo" : episode["youtube"] ? "youtube" : "video"
                    };
                })
            )).sort((a, b) => a.order - b.order);
    }


}

export default new Scraper();