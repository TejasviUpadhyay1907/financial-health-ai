"""
Narrative insights via LLM (OpenAI or mock). AI must NOT calculate or invent numbers.
Input: computed metrics_json + risk_flags from assessment. Output: plain-language explanation,
recommendations, and suggested financial product types.
"""
import json
from typing import Any

from app.config import get_settings

LANG_INSTRUCTIONS = {
    "hi": "Respond entirely in Hindi (Devanagari script).",
    "en": "Respond in English.",
}


def build_insights_prompt(
    metrics_json: dict[str, Any],
    risk_flags: list[str],
    health_score: int,
    risk_level: str,
    lang: str,
) -> str:
    """Build system + user prompt with only provided data; no AI calculation."""
    lang_instruction = LANG_INSTRUCTIONS.get(lang, LANG_INSTRUCTIONS["en"])
    metrics_str = json.dumps(metrics_json, indent=2)
    flags_str = json.dumps(risk_flags)

    return f"""You are a helpful financial advisor for small business owners. You explain things in simple terms.

RULES (strict):
- Do NOT calculate or invent any numbers. Use ONLY metrics and risk flags provided below.
- Do NOT add new metrics or scores. Only interpret what is given.
- Keep explanations short and actionable.

{lang_instruction}

Given the following computed metrics and risk flags (already calculated by our system), produce:

1. **Simple explanation**: 2–3 sentences for a non-finance business owner explaining what the numbers mean and their overall financial health (score: {health_score}, risk: {risk_level}).

2. **Actionable recommendations**: Bullet points on cost optimization, working capital, or cash flow (based only on risk flags and metrics provided).

3. **Suggested financial product types**: From this list only—suggest which might be relevant based on the data: Overdraft (OD), Cash Credit (CC), Invoice discounting, Term loan, Debt restructuring, Working capital loan. Say which types could help and why in one line each (do not invent numbers).

Metrics (use only these):
{metrics_str}

Risk flags (use only these):
{flags_str}

Output format: use clear headings (Explanation, Recommendations, Suggested products) and keep total length under 400 words."""


def generate_mock_insights(
    metrics_json: dict[str, Any],
    risk_flags: list[str],
    health_score: int,
    risk_level: str,
    lang: str,
) -> str:
    """Generate mock insights when LLM is unavailable."""
    if lang == "hi":
        return """### व्याख्या
आपका वित्तीय स्वास्थ्य स्कोर {health_score} है जो {risk_level} जोखिम स्तर को दर्शाता है। यह आपके वित्तीय प्रदर्शन का सारांश है।

### सिफारिशें
- नकदी प्रवाह प्रबंधन पर ध्यान दें
- लागत नियंत्रण उपायों को लागू करें
- कार्यशील पूंजी अनुकूलन पर विचार करें

### सुझाए गए वित्तीय उत्पाद
- कार्यशील पूंजी ऋण: दैनिक संचालन के लिए
- ओवरड्राफ्ट: अल्पकालिक नकदी आवश्यकताओं के लिए"""
    else:
        return f"""### Explanation
Your financial health score is {health_score}, indicating {risk_level.lower()} risk level. This reflects your current business performance based on the provided financial data.

### Recommendations
- Focus on cash flow management and monitoring
- Implement cost control measures where possible
- Consider working capital optimization strategies
- Regular financial review and planning

### Suggested Financial Products
- Working Capital Loan: For daily operational needs
- Overdraft Facility: For short-term cash requirements
- Invoice Discounting: If you have outstanding receivables"""


def generate_insights(
    metrics_json: dict[str, Any],
    risk_flags: list[str],
    health_score: int,
    risk_level: str,
    lang: str = "en",
) -> str:
    """
    Generate narrative insights using configured LLM provider.
    Uses only provided metrics and flags; no calculation.
    """
    settings = get_settings()
    
    # Use mock provider if configured or if OpenAI is unavailable
    if settings.LLM_PROVIDER == "mock" or not settings.OPENAI_API_KEY:
        return generate_mock_insights(metrics_json, risk_flags, health_score, risk_level, lang)
    
    # Use OpenAI provider
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = build_insights_prompt(metrics_json, risk_flags, health_score, risk_level, lang)

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You explain SME financial health in simple language. You never invent or calculate numbers; you only interpret provided metrics and flags."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        text = response.choices[0].message.content or ""
        return text.strip()
    except Exception as e:
        # Fallback to mock on any error
        return generate_mock_insights(metrics_json, risk_flags, health_score, risk_level, lang)
