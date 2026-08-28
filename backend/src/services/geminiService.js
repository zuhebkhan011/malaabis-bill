/**
 * geminiService.js
 * Calls Google Gemini REST API directly to perform OCR and structured extraction from invoice files.
 */

const PROMPT = `You are an expert invoice OCR and billing system parser. Read the attached supplier invoice document carefully and extract structured business data.

Extract the following:
1. Supplier info: Name, phone number, address, invoice number, invoice date, purchase date, GST number.
2. Invoice summary: Invoice number, invoice date, total amount, discount amount, notes.
3. Products: Extract all line items with product name, quantity, purchase price, selling price (if listed/suggested), MRP (if listed), barcode (if printed next to it), SKU (if listed), category, and brand.
4. Confidence scores (0-100): Estimate your extraction confidence for:
   - "supplier": confidence in supplier name, address, and invoice details.
   - "products": confidence in finding all product line items and their quantities.
   - "prices": confidence in prices, totals, and MRPs.

Rules:
- Return ONLY valid JSON matching the exact schema specified.
- Do NOT include markdown tags, code block wrappers (like \`\`\`json), or any conversational text.
- If a value is missing, return an empty string or 0 as appropriate.

JSON Output Schema:
{
  "supplier": {
    "name": "string",
    "phone": "string",
    "address": "string",
    "invoiceNumber": "string",
    "invoiceDate": "string (YYYY-MM-DD)",
    "purchaseDate": "string (YYYY-MM-DD)",
    "gstNumber": "string"
  },
  "invoice": {
    "number": "string",
    "date": "string (YYYY-MM-DD)",
    "total": number,
    "discount": number,
    "notes": "string"
  },
  "products": [
    {
      "name": "string",
      "quantity": number,
      "purchasePrice": number,
      "sellingPrice": number,
      "mrp": number,
      "barcode": "string",
      "sku": "string",
      "category": "string",
      "brand": "string"
    }
  ],
  "confidence": {
    "supplier": number,
    "products": number,
    "prices": number
  }
}`;

async function extractInvoiceData(fileData, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "xxxxxxxxxxxxxxxx") {
    throw new Error("GEMINI_API_KEY is not configured in .env file");
  }

  let cleanBase64;
  if (Buffer.isBuffer(fileData)) {
    cleanBase64 = fileData.toString("base64");
  } else {
    cleanBase64 = fileData;
    if (fileData.includes(";base64,")) {
      cleanBase64 = fileData.split(";base64,")[1];
    }
  }

  const models = ["gemini-3.6-flash", "gemini-3.5-flash"];
  let result = null;
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: PROMPT },
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (response.ok) {
        const json = await response.json();
        if (json.candidates && json.candidates.length > 0) {
          result = json;
          break;
        }
      } else {
        const errorBody = await response.text();
        lastError = new Error(`Google Gemini API (${model}) returned status ${response.status}: ${errorBody}`);
      }
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        lastError = new Error("Google Gemini API request timed out. Please check your internet connection or try a smaller file.");
      } else {
        lastError = fetchErr;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!result || !result.candidates || result.candidates.length === 0) {
    throw lastError || new Error("No response candidates returned by Gemini AI");
  }

  const textOutput = result.candidates[0].content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error("Empty text response returned by Gemini AI");
  }

  return textOutput;
}

module.exports = {
  extractInvoiceData,
};
