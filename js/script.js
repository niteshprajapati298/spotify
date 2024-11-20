console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}
async function getSongs(folder) {
  currFolder = folder;
  try {
    let response = await fetch(`${folder}/`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    let as = div.getElementsByTagName("a");

    songs = [];
    for (let index = 0; index < as.length; index++) {
      const element = as[index];
      const href = element.href;
      console.log("Processing href:", href);

      // Ensure the folder path is correctly matched
      const folderPath = `${window.location.origin}${folder}/`;
      if (href.startsWith(folderPath) && href.endsWith(".mp3")) {
        // Extract song name
        const songPath = href.substring(folderPath.length);
        console.log("Extracted song path:", songPath);
        const songName = decodeURIComponent(songPath);
        console.log("Decoded song name:", songName);

        if (songName) {
          songs.push(songName);
        }
      }
    }

    console.log("Songs found:", songs);

    if (songs.length === 0) {
      console.warn("No songs found in folder:", folder);
    }

    let songUL = document
      .querySelector(".songList")
      .getElementsByTagName("ul")[0];
    if (songUL) {
      songUL.innerHTML = "";
      for (const song of songs) {
        songUL.innerHTML += `
            <li>
              <img class="invert" width="34" src="img/music.svg" alt="">
              <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Harry</div>
              </div>
              <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
              </div>
            </li>`;
      }

      Array.from(songUL.getElementsByTagName("li")).forEach((e) => {
        e.addEventListener("click", () => {
          playMusic(
            e.querySelector(".info").firstElementChild.innerHTML.trim()
          );
        });
      });
    }
    return songs;
  } catch (error) {
    console.error("Failed to fetch songs:", error);
  }
}
const playMusic = (track, pause = false) => {
  if (!track) {
    console.error("Track is invalid or empty");
    return; // Guard clause if track is invalid
  }

  // Use a proper path format
  const trackPath = `${currFolder}/${track}`;
  console.log("Track path:", trackPath);

  currentSong.src = trackPath;

  currentSong.addEventListener("error", (e) => {
    console.error(`Failed to load ${trackPath}:`, e);
  });

  currentSong
    .play()
    .then(() => console.log("Playing:", trackPath))
    .catch((error) => console.error("Failed to play music:", error));

  document.querySelector(".play").src = "img/pause.svg";
  document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  console.log("Displaying albums");

  // Fetch the album HTML
  let albumsResponse = await fetch(`http://127.0.0.1:5500/songs/`);
  let albumHTML = await albumsResponse.text();
  let div = document.createElement("div");
  div.innerHTML = albumHTML;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  let anchorsArray = Array.from(anchors);

  // Iterate over each anchor to create album cards
  for (let anchor of anchorsArray) {
    if (anchor.href.includes("/songs/")) {
      // Extract folder name from href
      let folder = anchor.href.split("/songs/")[1];
      console.log("Fetching folder:", folder);

      // Get metadata of the folder
      let infoResponse = await fetch(`/songs/${folder}/info.json`);
      let infoData = await infoResponse.json();

      // Append card to container with correct folder name
      cardContainer.innerHTML += `
              <div data-folder="${folder}" class="card">
                  <div class="play">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                      </svg>
                  </div>
                  <img src="/songs/${folder}/cover.jpg" alt="">
                  <h2>${infoData.title}</h2>
                  <p>${infoData.description}</p>
              </div>`;
    }
  }

  // Add click event listener to each card
  Array.from(document.getElementsByClassName("card")).forEach((card) => {
    card.addEventListener("click", async (event) => {
      let folder = event.currentTarget.dataset.folder;
      console.log("Fetching Songs for folder:", folder);

      // Fetch the songs for the clicked folder
      let songs = await getSongs(`/songs/${folder}`);
      console.log("Playing first song", songs);

      // Play the first song
      playMusic(songs[0]);
    });
  });
}
async function main() {
  try {
    // Initialize player
    await getSongs("/songs/ncs");
    playMusic(songs[0], true);

    // Display all albums
    await displayAlbums();

    // Ensure elements exist before adding event listeners
    let playButton = document.querySelector("#play");
    let seekbar = document.querySelector(".seekbar");
    let hamburger = document.querySelector(".hamburger");
    let closeButton = document.querySelector(".close");
    let previousButton = document.querySelector("#previous");
    let nextButton = document.querySelector("#next");
    let volumeRangeInput = document.querySelector(".range input");
    let volumeIcon = document.querySelector(".volume img");

    if (playButton) {
      playButton.addEventListener("click", () => {
        if (currentSong.paused) {
          currentSong.play();
          playButton.src = "img/pause.svg";
        } else {
          currentSong.pause();
          playButton.src = "img/play.svg";
        }
      });
    }

    if (currentSong) {
      currentSong.addEventListener("timeupdate", () => {
        document.querySelector(
          ".songtime"
        ).innerHTML = `${secondsToMinutesSeconds(
          currentSong.currentTime
        )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = `${
          (currentSong.currentTime / currentSong.duration) * 100
        }%`;
      });
    }

    if (seekbar) {
      seekbar.addEventListener("click", (event) => {
        let percent =
          (event.offsetX / event.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
        if (currentSong) {
          currentSong.currentTime = (currentSong.duration * percent) / 100;
        }
      });
    }

    if (hamburger) {
      hamburger.addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
      });
    }

    if (previousButton) {
      previousButton.addEventListener("click", () => {
        if (currentSong) {
          currentSong.pause();
          console.log("Previous clicked");
          let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
          if (index > 0) {
            playMusic(songs[index - 1]);
          }
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (currentSong) {
          currentSong.pause();
          console.log("Next clicked");
          let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
          if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
          }
        }
      });
    }

    if (volumeRangeInput) {
      volumeRangeInput.addEventListener("change", (event) => {
        console.log("Setting volume to", event.target.value, "/ 100");
        if (currentSong) {
          currentSong.volume = parseInt(event.target.value) / 100;
        }
        if (volumeIcon) {
          volumeIcon.src =
            currentSong && currentSong.volume > 0
              ? volumeIcon.src.replace("mute.svg", "volume.svg")
              : volumeIcon.src.replace("volume.svg", "mute.svg");
        }
      });
    }

    if (volumeIcon) {
      volumeIcon.addEventListener("click", (event) => {
        if (event.target.src.includes("volume.svg")) {
          event.target.src = event.target.src.replace("volume.svg", "mute.svg");
          if (currentSong) {
            currentSong.volume = 0;
          }
          if (volumeRangeInput) {
            volumeRangeInput.value = 0;
          }
        } else {
          event.target.src = event.target.src.replace("mute.svg", "volume.svg");
          if (currentSong) {
            currentSong.volume = 0.1;
          }
          if (volumeRangeInput) {
            volumeRangeInput.value = 10;
          }
        }
      });
    }
  } catch (error) {
    console.error("An error occurred in main:", error);
  }
}

main();
