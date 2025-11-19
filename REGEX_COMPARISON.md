# Regex Parsing Bug - Visual Comparison

## Input Text Analysis

```
Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111
```

---

## OLD REGEX (BUGGY) ❌

### Pattern:
```regex
(?:Account Number)\\s*:?\\s*([\\w\\s\\-]+)
```

### Breakdown:
| Component | Meaning | Example Match |
|-----------|---------|---------------|
| `(?:Account Number)` | Non-capturing group for field label | `"Account Number"` |
| `\\s*` | Zero or more whitespace | `" "` |
| `:?` | Optional colon | `":"` |
| `\\s*` | Zero or more whitespace | `" "` |
| `([\\w\\s\\-]+)` | **CAPTURE GROUP (PROBLEMATIC)** | ❌ Too greedy! |
| `\\w` | Word characters (a-z, A-Z, 0-9, _) | Matches digits, letters |
| `\\s` | Whitespace (space, tab, **newline**) | Matches ALL whitespace |
| `\\-` | Literal hyphen/dash | Matches `-` |
| `+` | One or more (greedy) | Keeps matching! |

### What Happens:

```
Input: "Account number: 78800058952   -\nAccount type: SAVINGS"
                        └─────────────────────────────────┘
                         THIS ENTIRE PART GETS CAPTURED!
```

**Step-by-step:**
1. Match `"Account number:"` ✅
2. Start capturing with `([\\w\\s\\-]+)`:
   - `7` `8` `8` `0` `0` `0` `5` `8` `9` `5` `2` ← digits = `\\w` ✅
   - `   ` ← spaces = `\\s` ✅
   - `-` ← dash = `\\-` ✅
   - `\n` ← newline = `\\s` ✅ **BUG HERE!**
   - `A` `c` `c` `o` `u` `n` `t` ← letters = `\\w` ✅ **WRONG!**
   - ` ` ← space = `\\s` ✅
   - `t` `y` `p` `e` ← letters = `\\w` ✅ **WRONG!**
3. **Result:** `"78800058952   -\nAccount type"`

### All Problematic Extractions:

```
❌ accountNumber: "78800058952   -\nAccount type"
   Expected: "78800058952"
   Problem: Captured newline + next field name

❌ accountType: "SAVINGS   -  \nPHONE"
   Expected: "SAVINGS"
   Problem: Captured dash, spaces, newline, next field

❌ idDocumentNumber: "1235039039   - Address"
   Expected: "1235039039"
   Problem: Captured dash + next field name
```

---

## NEW REGEX (FIXED) ✅

### Pattern:
```regex
(?:Account Number)\\s*:?\\s*([^:\\n]+?)(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)
```

### Breakdown:
| Component | Meaning | Why It Works |
|-----------|---------|--------------|
| `(?:Account Number)` | Field label (non-capturing) | Same as before ✅ |
| `\\s*:?\\s*` | Whitespace + optional colon | Same as before ✅ |
| `([^:\\n]+?)` | **CAPTURE GROUP (FIXED)** | ✅ Stops at newlines! |
| `[^:\\n]` | Anything EXCEPT colon or newline | Won't cross field boundaries |
| `+?` | One or more (**non-greedy**) | Stops at first lookahead match |
| `(?=...)` | **LOOKAHEAD (KEY FIX)** | ✅ Defines stop conditions! |
| `\\s+-\\s+[A-Z]` | Space(s) + dash + space(s) + capital | Matches ` - A` |
| `\\n[A-Z]` | Newline + capital letter | Matches `\nA` |
| `$` | End of string | Matches end of input |

### What Happens:

```
Input: "Account number: 78800058952   -\nAccount type: SAVINGS"
                        └────────────┘  (lookahead stops here)
                         ONLY THIS CAPTURED!
```

**Step-by-step:**
1. Match `"Account number:"` ✅
2. Start capturing with `([^:\\n]+?)`:
   - `7` `8` `8` `0` `0` `0` `5` `8` `9` `5` `2` ← not colon/newline ✅
   - `   ` ← spaces (not colon/newline) ✅
   - `-` ← dash (not colon/newline) ✅
   - **Check lookahead:** Is `"   -\nAccount"` matching `\\s+-\\s+[A-Z]`?
     - `   ` = `\\s+` ✅
     - `-` = `-` ✅
     - `\n` = `\\s+` ✅
     - `A` = `[A-Z]` ✅
     - **YES! Stop here!**
3. **Captured:** `"78800058952   -"`
4. **Post-process cleanup:**
   - `.trim()` → `"78800058952   -"`
   - `.replace(/[\s\-]+$/, '')` → `"78800058952"` ✅

### All Fixed Extractions:

```
✅ accountNumber: "78800058952"
   Stopped at: "   -\nAccount" (matches lookahead)

✅ accountType: "SAVINGS"
   Stopped at: "   -  \nPhone" (matches lookahead)

✅ idDocumentNumber: "1235039039"
   Stopped at: "   - Address" (matches lookahead)

✅ address: "Calle 110 #45-47"
   Internal dash preserved! Only stopped at "   - City"

✅ city: "Bogota"
   Stopped at: "   -\nPost" (matches lookahead)

✅ postCode: "110111"
   Stopped at: $ (end of string)
```

---

## Side-by-Side Comparison

### Test Case: `"Phone: 3136379718   - City: Bogota"`

| Aspect | OLD REGEX ❌ | NEW REGEX ✅ |
|--------|-------------|-------------|
| **Pattern** | `([\\w\\s\\-]+)` | `([^:\\n]+?)(?=\\s+-\\s+[A-Z]|...|$)` |
| **Quantifier** | `+` (greedy) | `+?` (non-greedy) |
| **Character Class** | `[\\w\\s\\-]` (words, spaces, dashes) | `[^:\\n]` (anything except `:` and newlines) |
| **Stop Condition** | ❌ None! Matches until pattern fails | ✅ Lookahead `(?=\\s+-\\s+[A-Z])` |
| **Captures** | `"3136379718   - City"` ❌ | `"3136379718"` ✅ |
| **Wise API Sees** | `"3136379718   - City"` (INVALID) | `"3136379718"` (VALID) |

---

## Regex Visualization

### OLD (Greedy Match):

```
Input:    P h o n e :   3 1 3 6   -   C i t y
Pattern:               [─────────────────────]
          (?:Phone)\\s*:?\\s* ([\\w\\s\\-]+)
                                └── greedy! matches everything until ":" or end
Result:   "3136   - City" ❌
```

### NEW (Lookahead Boundary):

```
Input:    P h o n e :   3 1 3 6   -   C i t y
Pattern:               [──────]│
          (?:Phone)\\s*:?\\s* ([^:\\n]+?) (?=\\s+-\\s+[A-Z])
                                └── non-greedy │
                                                └── lookahead stops here!
Result:   "3136" ✅
```

---

## Key Differences Summary

| Feature | OLD REGEX | NEW REGEX |
|---------|-----------|-----------|
| **Character Class** | `[\\w\\s\\-]` - Matches words, spaces, dashes | `[^:\\n]` - Matches everything EXCEPT colons and newlines |
| **Quantifier** | `+` - Greedy (match as much as possible) | `+?` - Non-greedy (match as little as possible) |
| **Stop Condition** | None - keeps matching until pattern fails | Lookahead - stops at ` - [Capital]`, `\n[Capital]`, or `$` |
| **Whitespace** | `\\s` matches newlines → crosses line boundaries | `[^\\n]` excludes newlines → stays on same line |
| **Cleanup** | None | `.replace(/[\s\-]+$/, '')` removes trailing junk |
| **Preserves Internal Dashes** | ❌ No (captures all dashes) | ✅ Yes (only stops at separator dashes with lookahead) |

---

## The Critical Insight

### The Problem:
```regex
[\\w\\s\\-]+
```
This says: "Match word characters, whitespace, or dashes **one or more times**"

Since `\\s` includes **newlines**, it happily jumps to the next line and keeps capturing!

### The Solution:
```regex
[^:\\n]+?(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)
```
This says: "Match anything except colons and newlines, **as few times as possible**, until you see:
- A dash between spaces before a capital letter, OR
- A newline before a capital letter, OR
- The end of the string"

---

## Lessons Learned

1. **Be Specific About Boundaries:**
   - ❌ `[\\w\\s\\-]+` - Too vague, matches too much
   - ✅ `[^:\\n]+?` - Specific about what to exclude

2. **Use Non-Greedy Quantifiers:**
   - ❌ `+` - Matches as much as possible
   - ✅ `+?` - Matches as little as possible (stops at first boundary)

3. **Lookaheads Define Boundaries:**
   - `(?=\\s+-\\s+[A-Z])` - Stops before separator dashes
   - Doesn't consume the lookahead (zero-width)
   - Preserves internal dashes like "45-47"

4. **Post-Process Cleanup:**
   - Even with good regex, cleanup is important
   - `.replace(/[\s\-]+$/, '')` removes trailing garbage

---

**Generated:** 2025-11-19
