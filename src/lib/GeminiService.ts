export async function analyzeProtocolRisk(protocolData: any) {
  try {
    const response = await fetch("/api/analyze-risk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ protocolData }),
    });

    const body = await response.json();

    if (!response.ok) {
      return body;
    }

    return body;
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    return { 
      score: 99, 
      status: "CRITICAL",
      justification: "AI Analysis Communication Error. Precautionary mode enabled.",
      yieldAdjustment: "N/A"
    };
  }
}
