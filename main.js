import Scraper from "./lib/scraper.js";
import {createInterface} from "readline";
import Video from "./lib/video.js";
import clipboardy from "clipboardy";

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
})

async function requestCourseIndex(courses) {
    console.clear();
    console.log("Found courses:");
    console.log(courses.map((c, i) => `${i}. ${c}`).join("\n"));

    const pr = new Promise((resolve, reject) => {
        readline.question("Select a course: ", async (answer) => {
            const index = parseInt(answer);

            if (!courses[index])
                return reject("Invalid course index");

            resolve(index);
        });
    });

    try {
        return await pr;
    } catch (err) {
        return requestCourseIndex(courses);
    }
}

async function requestCourseEpisodeIndex(episodes) {
    console.clear();
    console.log("Found Episodes:");
    console.log(episodes.map((e, i) => `${i}. [${e.emoji}][${e.length}] ${e.name}`).join("\n"));

    const pr = new Promise((resolve, reject) => {
        readline.question("Select an episode: ", async (answer) => {
            const index = parseInt(answer);

            if (!episodes[index])
                return reject("Invalid course index");

            resolve(index);
        });
    });

    try {
        return await pr;
    } catch (err) {
        return requestCourseEpisodeIndex(episodes);
    }
}

async function requestEpisodeAction(episode) {
    console.clear();
    console.log("Select an action: ");
    console.log("1. Show URL");
    console.log("2. Restart")
    if (episode.type === "vimeo") {
        console.log("3. Download Video");
    }

    const pr = new Promise((resolve, reject) => {
        readline.question("Select an episode: ", async (answer) => {
            const index = parseInt(answer);

            if (index > 3) {
                reject("Invalid action");
            }

            if (index === 3 && episode.type !== "vimeo") {
                reject("Invalid action");
            }

            resolve(index);
        });
    });

    try {
        return await pr;
    } catch (err) {
        return requestEpisodeAction(episode);
    }
}


const main = async (skipCourseIndex) => {
    console.log("[+] Fetching courses...");
    const courses = await Scraper.getCourses();
    const courseIndex = skipCourseIndex || await requestCourseIndex(courses);

    skipCourseIndex && console.clear();

    console.log("[+] Fetching episodes...");
    const course = await Scraper.getCourseEpisodes(courses[courseIndex]);
    const episodeIndex = await requestCourseEpisodeIndex(course);
    const episode = course[episodeIndex];

    const actionIndex = await requestEpisodeAction(episode);

    switch (actionIndex) {
        case 1:
            console.clear();
            console.log("[+] Fetching URL...")
            clipboardy.writeSync(await new Video(episode.id, episode.type).getUrl())
            return main(courseIndex)
        case 2:
            return main();
        case 3:
            console.clear();
            console.log("[+] Downloading Video...")
            await new Video(episode.id, episode.type).download(`${episode.name}.mp4`)
            console.log(`[+] Video downloaded to ./${episode.name}.mp4`);
            return main(courseIndex)
    }
}

main()