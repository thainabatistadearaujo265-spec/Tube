import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import ytdl from "@distube/ytdl-core";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API to get video info
  app.get("/api/info", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      const info = await ytdl.getInfo(videoUrl);
      const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

      res.json({
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[0].url,
        duration: info.videoDetails.lengthSeconds,
        author: info.videoDetails.author.name,
        downloadUrl: `/api/download?url=${encodeURIComponent(videoUrl)}`
      });
    } catch (error) {
      console.error("Error fetching info:", error);
      res.status(500).json({ error: "Failed to fetch video information" });
    }
  });

  // API to stream download
  app.get("/api/download", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).send("URL is required");
    }

    try {
      if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).send("Invalid YouTube URL");
      }

      const info = await ytdl.getInfo(videoUrl);
      const title = info.videoDetails.title.replace(/[^\x00-\x7F]/g, "").replace(/[/\\?%*:|"<>]/g, '-');

      res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
      res.header("Content-Type", "audio/mpeg");

      const stream = ytdl(videoUrl, {
        filter: "audioonly",
        quality: "highestaudio",
      });

      stream.on('error', (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).send("Stream error occurred");
        }
      });

      stream.pipe(res);

    } catch (error) {
      console.error("Error downloading:", error);
      if (!res.headersSent) {
        res.status(500).send("Failed to download audio");
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
