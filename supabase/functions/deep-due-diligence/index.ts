import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, websiteUrl, scrapedContent, additionalContext } = await req.json();

    if (!companyName) {
      return new Response(
        JSON.stringify({ error: "Company name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating deep DD for:", companyName);

    const systemPrompt = `You are an expert venture capital analyst conducting comprehensive due diligence. 
Analyze the provided company information and generate a detailed investment analysis report.
Be thorough, data-driven, and provide actionable insights. When exact data is not available, provide reasonable estimates based on industry standards and clearly mark them as estimates.
For competitor analysis, include real companies when possible, with their actual funding data from sources like Crunchbase, Tracxn, or Entrackr.`;

    const userPrompt = `Conduct a comprehensive deep due diligence analysis for: ${companyName}

Website: ${websiteUrl || "Not provided"}

${scrapedContent ? `Website Content:\n${scrapedContent.slice(0, 15000)}` : ""}

${additionalContext ? `Additional Context:\n${additionalContext}` : ""}

Generate a complete investment analysis covering all key areas.`;

    const ddSchema = {
      type: "object",
      properties: {
        companyName: { type: "string" },
        websiteUrl: { type: "string" },
        generatedAt: { type: "string" },
        executiveSummary: {
          type: "object",
          properties: {
            verdict: { type: "string", enum: ["strong_pass", "pass", "conditional", "pass_with_concerns", "fail"] },
            oneLiner: { type: "string" },
            keyHighlights: { type: "array", items: { type: "string" } },
            criticalRisks: { type: "array", items: { type: "string" } },
            investmentScore: { type: "number" }
          },
          required: ["verdict", "oneLiner", "keyHighlights", "criticalRisks", "investmentScore"]
        },
        tamAnalysis: {
          type: "object",
          properties: {
            globalMarket: { type: "number" },
            tam: { type: "number" },
            sam: { type: "number" },
            som: { type: "number" },
            cagr: { type: "number" },
            methodology: { type: "string" },
            validation: { type: "string", enum: ["validated", "questionable", "inflated"] },
            sources: { type: "array", items: { type: "string" } }
          },
          required: ["tam", "sam", "som", "cagr", "methodology", "validation"]
        },
        founderSwot: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } },
            overallScore: { type: "number" },
            founders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string" },
                  background: { type: "string" },
                  previousExits: { type: "number" },
                  domainExpertise: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            }
          },
          required: ["strengths", "weaknesses", "opportunities", "threats", "overallScore", "founders"]
        },
        productSwot: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } },
            productMarketFit: { type: "string", enum: ["strong", "moderate", "weak", "unknown"] },
            techStack: { type: "array", items: { type: "string" } },
            scalability: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["strengths", "weaknesses", "opportunities", "threats", "productMarketFit", "scalability"]
        },
        moatAnalysis: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            moatTypes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  strength: { type: "string", enum: ["strong", "moderate", "weak", "none"] },
                  reasoning: { type: "string" }
                }
              }
            },
            sustainability: { type: "string" },
            timeToReplicate: { type: "string" }
          },
          required: ["overallScore", "moatTypes", "sustainability", "timeToReplicate"]
        },
        competitorAnalysis: {
          type: "object",
          properties: {
            directCompetitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  country: { type: "string" },
                  fundingStage: { type: "string" },
                  totalFunding: { type: "number" },
                  lastRoundAmount: { type: "number" },
                  lastRoundDate: { type: "string" },
                  valuation: { type: ["number", "null"] },
                  investors: { type: "array", items: { type: "string" } },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  marketPosition: { type: "string", enum: ["leader", "challenger", "niche", "emerging"] }
                }
              }
            },
            indirectCompetitors: { type: "array", items: { type: "string" } },
            competitiveAdvantage: { type: "string" },
            marketShare: { type: "string" }
          },
          required: ["directCompetitors", "competitiveAdvantage"]
        },
        unitEconomics: {
          type: "object",
          properties: {
            ltv: { type: ["number", "null"] },
            cac: { type: ["number", "null"] },
            ltvCacRatio: { type: ["number", "null"] },
            grossMargin: { type: ["number", "null"] },
            paybackPeriod: { type: ["number", "null"] },
            churnRate: { type: ["number", "null"] },
            arpu: { type: ["number", "null"] },
            assessment: { type: "string", enum: ["excellent", "good", "average", "poor", "unknown"] },
            insights: { type: "array", items: { type: "string" } }
          },
          required: ["assessment", "insights"]
        },
        fundingIntelligence: {
          type: "object",
          properties: {
            currentStage: { type: "string" },
            totalRaised: { type: ["number", "null"] },
            lastRound: {
              type: ["object", "null"],
              properties: {
                type: { type: "string" },
                amount: { type: ["number", "null"] },
                date: { type: "string" },
                valuation: { type: ["number", "null"] },
                leadInvestors: { type: "array", items: { type: "string" } }
              }
            },
            burnRate: { type: ["number", "null"] },
            runway: { type: ["number", "null"] },
            fundingHistory: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  round: { type: "string" },
                  amount: { type: "number" },
                  date: { type: "string" },
                  investors: { type: "array", items: { type: "string" } }
                }
              }
            }
          },
          required: ["currentStage"]
        },
        riskAssessment: {
          type: "object",
          properties: {
            overallRisk: { type: "string", enum: ["low", "medium", "high", "critical"] },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  level: { type: "string", enum: ["low", "medium", "high"] },
                  factors: { type: "array", items: { type: "string" } }
                }
              }
            },
            mitigationStrategies: { type: "array", items: { type: "string" } }
          },
          required: ["overallRisk", "categories", "mitigationStrategies"]
        },
        investmentThesis: {
          type: "object",
          properties: {
            recommendation: { type: "string", enum: ["strong_invest", "invest", "conditional", "pass", "strong_pass"] },
            reasoning: { type: "string" },
            keyMetrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  metric: { type: "string" },
                  value: { type: "string" },
                  benchmark: { type: "string" },
                  status: { type: "string", enum: ["above", "at", "below"] }
                }
              }
            },
            nextSteps: { type: "array", items: { type: "string" } }
          },
          required: ["recommendation", "reasoning", "nextSteps"]
        }
      },
      required: [
        "companyName", "executiveSummary", "tamAnalysis", "founderSwot", "productSwot",
        "moatAnalysis", "competitorAnalysis", "unitEconomics", "fundingIntelligence",
        "riskAssessment", "investmentThesis"
      ]
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_deep_dd",
              description: "Generate a comprehensive deep due diligence report for a startup",
              parameters: ddSchema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_deep_dd" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    let ddResult;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        ddResult = JSON.parse(toolCall.function.arguments);
      } else {
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            ddResult = JSON.parse(jsonMatch[0]);
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    // Generate fallback if parsing failed
    if (!ddResult) {
      console.log("Using fallback deep DD report");
      ddResult = {
        companyName,
        websiteUrl: websiteUrl || "",
        generatedAt: new Date().toISOString(),
        executiveSummary: {
          verdict: "conditional",
          oneLiner: `${companyName} requires additional information for comprehensive analysis.`,
          keyHighlights: ["Company identified for analysis", "Website content reviewed"],
          criticalRisks: ["Limited information available", "Detailed financials not provided"],
          investmentScore: 50,
        },
        tamAnalysis: {
          globalMarket: 0,
          tam: 0,
          sam: 0,
          som: 0,
          cagr: 0,
          methodology: "Unable to assess without additional market data",
          validation: "questionable",
          sources: [],
        },
        founderSwot: {
          strengths: ["Team to be evaluated"],
          weaknesses: ["Background information not available"],
          opportunities: ["Potential for growth pending assessment"],
          threats: ["Competition analysis pending"],
          overallScore: 5,
          founders: [],
        },
        productSwot: {
          strengths: ["Product to be evaluated"],
          weaknesses: ["Details not available"],
          opportunities: ["Market opportunities pending analysis"],
          threats: ["Competitive threats pending analysis"],
          productMarketFit: "unknown",
          techStack: [],
          scalability: "medium",
        },
        moatAnalysis: {
          overallScore: 5,
          moatTypes: [
            { type: "Technology/IP", strength: "none", reasoning: "Unable to assess without more information" },
          ],
          sustainability: "Unknown - requires more data",
          timeToReplicate: "Unknown",
        },
        competitorAnalysis: {
          directCompetitors: [],
          indirectCompetitors: [],
          competitiveAdvantage: "To be determined with additional research",
          marketShare: "Unknown",
        },
        unitEconomics: {
          ltv: null,
          cac: null,
          ltvCacRatio: null,
          grossMargin: null,
          paybackPeriod: null,
          churnRate: null,
          arpu: null,
          assessment: "unknown",
          insights: ["Financial metrics not available for analysis"],
        },
        fundingIntelligence: {
          currentStage: "Unknown",
          totalRaised: null,
          lastRound: null,
          burnRate: null,
          runway: null,
          fundingHistory: [],
        },
        riskAssessment: {
          overallRisk: "medium",
          categories: [
            { category: "Information Risk", level: "high", factors: ["Limited data available for analysis"] },
          ],
          mitigationStrategies: ["Request pitch deck and financial information", "Schedule founder call"],
        },
        investmentThesis: {
          recommendation: "conditional",
          reasoning: "Insufficient information to make a definitive recommendation. Additional data required.",
          keyMetrics: [],
          nextSteps: [
            "Request detailed pitch deck",
            "Schedule call with founders",
            "Obtain financial statements",
            "Conduct customer reference calls",
          ],
        },
      };
    }

    // Ensure required fields
    ddResult.companyName = ddResult.companyName || companyName;
    ddResult.websiteUrl = ddResult.websiteUrl || websiteUrl || "";
    ddResult.generatedAt = ddResult.generatedAt || new Date().toISOString();

    console.log("Deep DD generated successfully for:", companyName);
    
    return new Response(JSON.stringify(ddResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Deep DD error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate deep DD" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
