import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

async function getProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('data')
      .eq('id', 1)
      .single();
    
    if (error || !data) return [];
    return data.data;
  } catch (err) {
    console.error("Error reading products from Supabase:", err);
    return [];
  }
}

async function saveProducts(products: any) {
  try {
    const { error } = await supabase
      .from('products')
      .upsert({ id: 1, data: products });
    
    if (error) console.error("Supabase Save Error:", error);
  } catch (err) {
    console.error("Error saving products to Supabase:", err);
  }
}

async function extractProductInfo(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    $("script, style, iframe, noscript, footer, nav, header").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    const meta = {
      title: $("title").text(),
      description: $('meta[name="description"]').attr("content"),
      ogTitle: $('meta[property="og:title"]').attr("content"),
    };

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Extract product information from this webpage content and metadata.
          Return the data in JSON format:
          {
            "name": "Product Name",
            "seller": "Seller Name",
            "price": number,
            "shippingFee": number
          }
          
          Webpage Metadata: ${JSON.stringify(meta)}
          Webpage Content: ${text.substring(0, 15000)}`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(result.response.text());
  } catch (err: any) {
    console.error(`Extraction failed for ${url}:`, err.message);
    return null;
  }
}

async function runDailyCrawl() {
  console.log("Starting daily crawl at", new Date().toLocaleString());
  const products = await getProducts();
  
  for (const product of products) {
    // Update main product price
    if (product.productLink) {
      const info = await extractProductInfo(product.productLink);
      if (info) {
        product.price = info.price || product.price;
        product.shippingFee = info.shippingFee || product.shippingFee;
      }
    }

    // Update competitors
    if (product.competitors) {
      for (const comp of product.competitors) {
        if (comp.link) {
          const info = await extractProductInfo(comp.link);
          if (info) {
            comp.price = info.price || comp.price;
            comp.shippingFee = info.shippingFee || comp.shippingFee;
            comp.name = info.seller || info.name || comp.name;
          }
        }
      }
    }
    product.lastUpdated = "방금 전 (자동)";
  }

  await saveProducts(products);
  console.log("Daily crawl completed at", new Date().toLocaleString());
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch and clean URL content
  app.get("/api/fetch-url", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // Set a generic User-Agent to avoid blocks
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles, and other noise
      $("script, style, iframe, noscript, footer, nav, header").remove();
      
      // Get the body text and clean it up
      const text = $("body").text().replace(/\s+/g, " ").trim();
      
      // Also get meta tags which often contain useful info
      const meta = {
        title: $("title").text(),
        description: $('meta[name="description"]').attr("content"),
        ogTitle: $('meta[property="og:title"]').attr("content"),
        ogDescription: $('meta[property="og:description"]').attr("content"),
      };

      res.json({ text: text.substring(0, 10000), meta }); // Limit text for tokens
    } catch (error: any) {
      console.error("Error fetching URL:", error.message);
      res.status(500).json({ error: "Failed to fetch URL content" });
    }
  });

  app.get("/api/analyze-product", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });
    
    const info = await extractProductInfo(url);
    if (info) {
      res.json(info);
    } else {
      res.status(500).json({ error: "Failed to extract info" });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    const products = await getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    await saveProducts(req.body);
    res.json({ success: true });
  });

  app.post("/api/crawl-all", async (req, res) => {
    runDailyCrawl(); // Run in background
    res.json({ message: "Crawl started in background" });
  });

  // Setup Cron Job: 10 PM every day
  cron.schedule("0 22 * * *", () => {
    runDailyCrawl();
  }, {
    timezone: "Asia/Seoul"
  });

  console.log("Cron job registered for 22:00 (Asia/Seoul)");

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
