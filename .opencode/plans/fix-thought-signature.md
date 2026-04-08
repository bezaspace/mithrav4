# Fix: Include thoughtSignature in Function Calls

## Problem
The Gemini API now requires `thoughtSignature` to be included when adding function calls to conversation history. Without it, the second API call (to get explanatory text) fails with:

```
Error [ApiError]: Function call is missing a thought_signature in functionCall parts. 
This is required for tools to work correctly.
```

## Root Cause
When Gemini returns a function call, it includes a `thoughtSignature` field that represents the model's internal reasoning. This signature must be preserved and sent back when continuing the conversation.

## Solution

### File to Modify: `src/app/api/chat-stream/route.ts`

### Changes Required:

#### 1. Capture and include thoughtSignature when adding function calls (around line 275-286)

**Current code:**
```typescript
// Add function call to conversation context
contents.push({
  role: "model",
  parts: [
    {
      functionCall: {
        name: call.name,
        args: call.args || {},
      },
    },
  ],
});
```

**New code:**
```typescript
// Add function call to conversation context (with thoughtSignature)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const functionCallPart: any = {
  functionCall: {
    name: call.name,
    args: call.args || {},
  },
};

// Include thoughtSignature if present (required for Gemini 3 models)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((call as any).thoughtSignature) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionCallPart.thoughtSignature = (call as any).thoughtSignature;
  console.log(`Including thoughtSignature for ${call.name}`);
}

contents.push({
  role: "model",
  parts: [functionCallPart],
});
```

#### 2. Also update the error handling section (around line 315-325)

**Current code:**
```typescript
// Still need to add function response (with error) to continue conversation
contents.push({
  role: "model",
  parts: [
    {
      functionCall: {
        name: call.name,
        args: call.args || {},
      },
    },
  ],
});
```

**New code:**
```typescript
// Still need to add function response (with error) to continue conversation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorFunctionCallPart: any = {
  functionCall: {
    name: call.name,
    args: call.args || {},
  },
};

// Include thoughtSignature if present
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((call as any).thoughtSignature) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorFunctionCallPart.thoughtSignature = (call as any).thoughtSignature;
}

contents.push({
  role: "model",
  parts: [errorFunctionCallPart],
});
```

## Key Points

1. **thoughtSignature is required** for Gemini 3 models when continuing conversations with function calling
2. **Only the first function call** in a parallel batch has the signature
3. **Must be included in the exact part** where it was received
4. **TypeScript casting** is needed because the SDK types may not expose this field directly

## Testing

After applying the fix:
1. Run `npm run dev`
2. Ask: "ఎలా ఉంది నా ఫిజియోథెరపీ?"
3. Should see:
   - Chart renders (from first API call)
   - Telugu text explanation streams (from second API call)
   - Audio plays the explanation

## Expected Flow

```
Turn 1:
  User: "How is my physiotherapy?"
  Gemini: function_calls [with thoughtSignatures]
  Server: executes tools, sends chart data to client
  
Turn 2:
  Server: sends conversation history WITH thoughtSignatures
  Gemini: generates Telugu explanation
  Server: streams text to client
  Client: displays chart + plays audio explanation
```
