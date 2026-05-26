# 🎵 SongLyrics

**SongLyrics** is a powerful, feature-rich Node.js CLI tool designed to scan your local MP3 library, detect missing lyrics, and automatically fetch and embed them. It prioritizes synced (LRC) lyrics and uses an intelligent scoring algorithm to ensure the best match for your tracks.

**New:** Features AI-powered transliteration for East Asian lyrics (Japanese, Chinese, Korean) and advanced path resolution with custom bookmarks!

## ✨ Features

- **Smart Lyrics Fetching & Scoring:** Queries LRCLIB and scores results based on duration variance and synced/unsynced status to find the most accurate lyrics.
- **AI CJK Transliteration:** Automatically detects Chinese, Japanese, and Korean lyrics and uses **Mistral AI** to transliterate them into Latin-script phonetics (Hepburn Romaji, Hanyu Pinyin, Revised Romanization) while strictly preserving LRC timestamps.
- **Advanced Path Resolution:** 
  - **Bookmarks:** Use aliases like `#{SL}` to represent long directory paths.
  - **Brace Expansion:** Scan multiple subdirectories easily using `#{SL}/{{Folder1, Folder2}}`.
- **High-Performance Concurrency:** Utilizes `p-limit` and `p-throttle` to read metadata and fetch lyrics concurrently without hitting API rate limits or causing memory spikes.
- **Flexible Scanning:** Recursive scanning, wildcard exclusions (e.g., ignore `*/.stversions/*`), and targeted rechecking.
- **Beautiful CLI UI:** Non-blocking progress bars (`cli-progress`) and spinners (`ora`) with a safe-logger to prevent UI tearing during concurrent API requests.
- **Safe Operations:** `--dry-run` mode to preview lyrics without modifying files, and graceful shutdown handling (`SIGINT`/`SIGTERM`).

## 📋 Prerequisites

- **Node.js** (v18+ recommended for native `fetch` and `node:util` `parseArgs`)
- **Mistral API Key** (Optional, only required if you want CJK transliteration)
- **Yarn** (v4+ recommended, as configured in `package.json`)

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

## ⚙️ Configuration

### 1. Environment Variables
Create a `.env` file in the root directory to enable AI transliteration:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### 2. Directory Bookmarks
You can define shortcuts for your music directories to avoid typing long paths. The app looks for `bookmarks.json` in:
1. `~/.config/songlyrics/bookmarks.json`
2. `./bookmarks.json` (Current Working Directory)

**Example `bookmarks.json`:**
```json
{
  "SL":  "/storage/emulated/0/Music/Song Library",
  "SL1": "/storage/emulated/0/Music/Song Library/#1 - Initial",
  "SL2": "/storage/emulated/0/Music/Song Library/#2 - Renamed",
  "SL3": "/storage/emulated/0/Music/Song Library/#3 - Done"
}
```
*Usage:* `songlyrics "#{SL2}"`

## 🚀 Usage

```bash
songlyrics [options] <directories...>```

### Options

| Flag | Long Flag | Description | Default |
| :--- | :--- | :--- | :--- |
| `-h` | `--help` | Display the help menu. | `false` |
| `-r` | `--recursive` | Walk through subfolders recursively. | `false` |
| `-e` | `--exclude <string>` | Exclude files/folders matching a wildcard pattern. *(Repeatable)* | `*/.stversions/*` |
| `-v` | `--variance <number>` | Maximum allowed duration variance in seconds. | `3` |
| `-s` | `--synced-only` | Only accept synced (LRC) lyrics. | `false` |
| `-c` | `--recheck` | Re-fetch lyrics for MP3s that already have plain (unsynced) lyrics. | `false` |
| `-d` | `--dry-run` | Fetch and display lyrics without modifying the MP3 files. | `false` |
| | `--debug` | Show verbose debug statements. | `false` |

### Examples

**Basic Scan:**
```bash
songlyrics "/path/to/music"
```

**Recursive Scan with Exclusions:**
```bash
songlyrics -r -e "*/.stversions/*" -e "*/Podcasts/*" "/path/to/music"
```

**Using Bookmarks & Brace Expansion:**
```bash
# Scans both "#1 - Initial" and "#2 - Renamed" folders inside the "SL" bookmark
songlyrics -r "#{SL}/{{#1 - Initial, #2 - Renamed}}"
```

**Dry Run (Preview without saving):**
```bash
songlyrics -d -r "#{SL2}"
```

## 🧠 How It Works

1. **Scanning:** Resolves paths (expanding bookmarks and braces), filters out excluded patterns, and reads ID3 tags/audio metadata concurrently using `p-limit`.
2. **Categorization:** Groups MP3s into `Synced`, `Unsynced`, and `None`. By default, it only processes the `None` group (unless `--recheck` is passed).
3. **Fetching & Scoring:** Queries LRCLIB. Results are filtered by the `--variance` threshold and scored. Synced lyrics get a heavy weight bonus.
4. **CJK Detection & Transliteration:** If the fetched lyrics contain >10% CJK characters, the text is sent to Mistral AI. The AI is strictly prompted to transliterate (Romaji/Pinyin/Romanization) without altering timestamps or English words.
5. **Embedding:** Updates the `unsynchronisedLyrics` (USLT) ID3 frame with the final text.

## 📝 TODOs

### ✅ Completed
- [x] Implement native Node.js `parseArgs` for CLI argument handling.- [x] Add `p-throttle` and `p-limit` to respect API rate limits and prevent memory spikes.
- [x] Add `p-throttle` and `p-limit` to respect API rate limits and prevent memory spikes.
- [x] Create a robust Lyrics Scoring algorithm (Duration variance + Synced weight).
- [x] Implement custom Bookmark system (`#{}`) and Brace Expansion (`{{}}`) for paths.
- [x] Add Safe Logger to prevent `cli-progress` and `ora` UI tearing during concurrent logs.
- [x] Integrate Mistral AI for context-aware CJK transliteration (preserving LRC timestamps).
- [x] Add Graceful Shutdown handlers (`SIGINT`, `SIGTERM`).
- [x] Implement `--dry-run` and `--recheck` modes.
- [x] Build a rich, colorized help menu using `console-table-printer`.
- [x] Configure ESLint and add a `lint-all` script for code quality enforcement.

### 🚧 Future / New TODOs
- [ ] **Unit Testing:** Write comprehensive tests using `jest` (currently in `devDependencies`) for the path resolver (brace expansion/bookmarks) and the lyrics scoring algorithm.
- [ ] **LRC File Export:** Add an option to save lyrics as external `.lrc` files alongside the MP3s, in addition to (or instead of) ID3 embedding.
- [ ] **Batching for Mistral:** Group multiple CJK lyric requests into a single Mistral API call to reduce latency and API overhead.
- [ ] **Fallback Providers:** Add support for fallback lyrics providers (e.g., Musixmatch, Genius) if LRCLIB returns empty.
- [ ] **ID3 Version Handling:** Add explicit handling/flags for ID3v2.3 vs ID3v2.4 encoding edge cases in `node-id3`.
- [ ] **Config File for Defaults:** Allow setting default CLI flags (like default exclusions or variance) via a `config.json` file.

## 📦 Tech Stack

- **Node.js** (Native `fetch`, `fs/promises`, `util.parseArgs`)
- **music-metadata** & **node-id3** (Audio parsing and tag writing)
- **@mistralai/mistralai** (AI Transliteration)
- **cli-progress** & **ora** (Terminal UI)
- **chalk** & **console-table-printer** (Styling and Help Menus)
- **p-limit** & **p-throttle** (Concurrency and Rate Limiting)

## 📄 License

MIT
