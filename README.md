# SongLyrics 🎵

**SongLyrics** is a powerful, feature-rich Node.js CLI tool designed to scan your local MP3 library, detect missing lyrics, and automatically fetch and embed them. It prioritizes synced (LRC) lyrics and uses an intelligent scoring algorithm to ensure the best match for your tracks.

## ✨ Features

- **Smart Directory Scanning:** Recursively scan folders for MP3s with support for wildcard exclusions.
- **Custom Path Bookmarks:** Define aliases for your most-used directories (e.g., `#{SL}`) to save typing.
- **Brace Expansion:** Easily target multiple similar paths using brace syntax (e.g., `/music/{{Rock, Pop}}`).
- **Intelligent Lyrics Matching:** Fetches from the `lrclib.net` API and scores results based on duration variance and synced lyric availability.
- **Beautiful CLI UI:** Color-coded terminal output, spinners, and clean tables powered by `chalk`, `ora`, and `console-table-printer`.
- **Concurrency:** Reads MP3 metadata concurrently using `p-limit` to speed up library scanning.

## 📦 Installation

1. Clone the repository:
```bash
   git clone https://github.com/yourusername/SongLyrics.git
   cd SongLyrics
```

2. Install dependencies:
```bash
   npm install
```

3. Link the CLI globally (optional, to use `songlyrics` or `lyrics` anywhere):
```bash
   npm link
```

## ⚙️ Configuration (Bookmarks)

SongLyrics supports custom path bookmarks so you don't have to type out long directory paths. 

Create a `bookmarks.json` file in one of the following locations (checked in this order):
1. `~/.config/songlyrics/bookmarks.json` (Recommended)
2. `./bookmarks.json` (Current working directory)

**Example `bookmarks.json`:**
```json
{
  "SL":  "/storage/emulated/0/Music/Song Library",
  "SL1": "/storage/emulated/0/Music/Song Library/#1 - Initial",
  "SL2": "/storage/emulated/0/Music/Song Library/#2 - Renamed",
  "SL3": "/storage/emulated/0/Music/Song Library/#3 - Done"
}
```
*Note: The tool includes default bookmarks out-of-the-box, but your JSON file will override/merge with them.*
## 🚀 Usage

```bash
songlyrics [options] <directories...>
# or
lyrics [options] <directories...>
```

### Options

| Flag | Long Flag | Description |
| :--- | :--- | :--- |
| `-h` | `--help` | Display the help menu. |
| `-r` | `--recursive` | Walk through subfolders recursively during the scan. |
| `-e` | `--exclude <pattern>` | Exclude files or folders matching a specific wildcard pattern. (Repeatable) |

### Examples

**Basic scan of a specific folder:**
```bash
songlyrics /path/to/my/music
```

**Recursive scan using a bookmark:**
```bash
songlyrics -r "#{SL2}"
```

**Recursive scan with exclusions:**
```bash
songlyrics -r -e "*/.stversions/*" -e "*/temp/*" "#{SL}"
```

**Using Brace Expansion:**
```bash
# Expands to /music/Rock and /music/Pop
songlyrics "/music/{{Rock, Pop}}" 
```

## 🧠 How It Works

1. **Parsing & Expansion:** Resolves CLI arguments, expands bookmarks (`#{...}`) and braces (`{{...}}`), and filters out non-directory paths.
2. **Scanning:** Recursively finds `.mp3` files, respecting exclusion patterns.
3. **Metadata Reading:** Reads ID3 tags and audio duration concurrently. It checks if unsynchronized or synchronized lyrics already exist.
4. **Categorization:** Groups tracks into `Synced`, `Unsynced`, and `No Lyrics`.
5. **Fetching:** For tracks missing lyrics, it queries the `lrclib.net` API.
6. **Scoring Algorithm:** When multiple lyric results are returned, it scores them based on:
   - **Duration Variance:** Penalizes tracks with a duration difference > 3 seconds.
   - **Synced Bonus:** Heavily weights results that include LRC timestamps.

## 📋 TODO

- [x] **Implement ID3 Writing:** Implemented `NodeID3.update()` to write fetched plain/synced lyrics back to the MP3 file's `USLT` frame.
- [x] **Optimize API Fetching:** Refactored `processGroup` in `processMp3s.js` to use `p-limit` for concurrent API requests.
- [x] **Implement Progress Bar:** Fully integrated `cli-progress` to show a progress bar during the fetching/writing phase.
- [ ] **Dry Run Mode:** Add a `--dry-run` flag to fetch and display lyrics without modifying the actual MP3 files.
- [ ] **Error Handling for Writing:** Add robust file-backup mechanisms before overwriting existing ID3 tags.
- [ ] **Configuration CLI:** Add a command to easily add/remove bookmarks directly from the CLI (e.g., `songlyrics config add SL /path/to/music`).

## 📄 License

MIT