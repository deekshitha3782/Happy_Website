# Fix OpenAI Quota Error (429)

## The Problem

You're seeing this error:
```
429 You exceeded your current quota, please check your plan and billing details.
```

This means your OpenAI API key has **no credits** or **billing is not set up**.

---

## Solution: Add Billing to OpenAI Account

### Step 1: Go to OpenAI Billing
1. Visit: **https://platform.openai.com/account/billing**
2. Sign in with your OpenAI account

### Step 2: Add Payment Method
1. Click **"Add payment method"** or **"Set up paid account"**
2. Add a credit card or payment method
3. OpenAI will charge you **only for what you use** (pay-as-you-go)
4. They often give **$5 free credit** to start

### Step 3: Verify Credits
1. Check your **Usage** page: https://platform.openai.com/usage
2. Make sure you have credits available
3. The free tier might have expired - you need paid credits

### Step 4: Test Your API Key
1. Go to: https://platform.openai.com/playground
2. Try making a test request
3. If it works, your key is good

---

## Cost Estimate

**OpenAI GPT-4o-mini pricing:**
- **Input:** ~$0.15 per 1M tokens
- **Output:** ~$0.60 per 1M tokens
- **Typical chat message:** ~500-1000 tokens
- **Cost per message:** ~$0.0003 - $0.0006 (very cheap!)

**Example:**
- 1000 messages = ~$0.30 - $0.60
- Very affordable for personal use!

---

## Alternative: Use a Different API Key

If you have another OpenAI account:
1. Get a new API key from: https://platform.openai.com/api-keys
2. Update in Render → Environment Variables
3. Set `AI_INTEGRATIONS_OPENAI_API_KEY` to the new key
4. Redeploy

---

## After Adding Billing

1. **Wait a few minutes** for billing to activate
2. **Try sending a message** again
3. **It should work!** 🎉

---

## Need Help?

- OpenAI Billing: https://platform.openai.com/account/billing
- OpenAI Support: https://help.openai.com
- Pricing: https://openai.com/pricing

---

## Quick Checklist

- [ ] Go to https://platform.openai.com/account/billing
- [ ] Add payment method
- [ ] Verify credits available
- [ ] Test API key in playground
- [ ] Try sending message again

**Once billing is set up, your chat will work!** ✅

