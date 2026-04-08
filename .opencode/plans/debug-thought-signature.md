# Debug Plan: thoughtSignature Not Being Captured

## Current Situation
The error persists even after the fix. The console log `Including thoughtSignature for...` is not appearing in the logs, which means `(call as any).thoughtSignature` is undefined.

## Root Cause Analysis
The thoughtSignature field from Gemini's response is likely:
1. Named differently in the SDK (not `thoughtSignature`)
2. Located in a different property path
3. Not being exposed by the TypeScript types

## Investigation Steps

### Step 1: Log the Full Function Call Object
Add detailed logging to see what properties are actually available on the function call object.

**File:** `src/app/api/chat-stream/route.ts`
**Location:** Line 251-252 (inside the for loop processing function calls)

**Action:** Log all properties of the call object:
```typescript
console.log(`Function call: ${call.name}`, call.args);
console.log(`Full call object keys:`, Object.keys(call));
console.log(`Full call object:`, JSON.stringify(call, null, 2));
```

### Step 2: Check Alternative Property Names
Based on Gemini docs, the signature might be in:
- `call.id` (the function call ID)
- `call.signature` 
- `call.thought_signature` (snake_case)
- Somewhere in the chunk metadata

**Action:** Check these alternative property names:
```typescript
console.log('thoughtSignature:', (call as any).thoughtSignature);
console.log('thought_signature:', (call as any).thought_signature);
console.log('signature:', (call as any).signature);
console.log('id:', (call as any).id);
```

### Step 3: Check Raw Response
The thoughtSignature might be in the raw response that the SDK wraps. Check if we can access the raw response data.

**Action:** Log the raw chunk to see what's available:
```typescript
console.log('Full chunk:', JSON.stringify(chunk, null, 2));
```

### Step 4: Alternative Approach - Store Raw Response
If we can't easily extract the signature, store the raw function call response and replay it exactly as received.

**Action:** Store the raw function call parts and replay them:
```typescript
// Store the raw function call from Gemini
const rawFunctionCalls: any[] = [];

// In the stream processing:
if (chunk.functionCalls) {
  rawFunctionCalls.push(...chunk.functionCalls);
}

// When building contents for Turn 2:
contents.push({
  role: "model",
  parts: rawFunctionCalls.map(fc => ({
    functionCall: fc,  // Use the EXACT object from Gemini
  }))
});
```

## Recommended Fix Strategy

If the SDK is not exposing `thoughtSignature`, we need to work around it:

### Option A: Store Raw Function Call Parts (Recommended)
Instead of reconstructing the function call parts, store them as-is from the chunk and replay them.

### Option B: Use interactions API (Alternative)
Switch to using Gemini's Interactions API which handles conversation state automatically.

### Option C: Use generateContent without streaming (Fallback)
Use non-streaming API where we have more control over the conversation structure.

## Debugging Code to Add

```typescript
// Inside the for await (const chunk of geminiStream) loop
// After: const functionCalls = chunk.functionCalls;

if (functionCalls && functionCalls.length > 0) {
  console.log('=== FUNCTION CALLS RECEIVED ===');
  console.log('Number of function calls:', functionCalls.length);
  
  functionCalls.forEach((call, idx) => {
    console.log(`\nCall ${idx}:`, call.name);
    console.log('  args:', call.args);
    console.log('  All keys:', Object.keys(call));
    
    // Try different property names
    const possibleSignatureKeys = [
      'thoughtSignature',
      'thought_signature', 
      'signature',
      'id',
      '_signature',
      'google'
    ];
    
    possibleSignatureKeys.forEach(key => {
      const value = (call as any)[key];
      if (value) {
        console.log(`  ${key}:`, value);
      }
    });
    
    // Check for nested properties
    if ((call as any).google) {
      console.log('  google:', (call as any).google);
    }
  });
  
  console.log('=== END FUNCTION CALLS ===\n');
}
```

## Next Steps

1. Add the debugging code above
2. Run the app and trigger a function call
3. Check console logs to find where thoughtSignature actually is
4. Update the fix to use the correct property path
5. Test again

## Questions for User

Do you want me to:
1. Add detailed debugging first to find where the signature is?
2. Try a different approach (store raw function call parts)?
3. Switch to a simpler method (like using the Interactions API)?
