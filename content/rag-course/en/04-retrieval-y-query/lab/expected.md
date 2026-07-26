# Expected — Lab M4

> Exact results produced by `python3 solution_scratch.py` on the `data/policies.json` corpus.
> Query: `"can I make changes to my flight without paying additional fees?"`
> Target fare class: `Basic`

---

## Without filter (full corpus, top-3)

The pipeline without filter returns documents from all three fares mixed. Top-1 is **Top** fare — most semantically relevant because it explicitly mentions "changes without additional fee", but it belongs to a different fare than the passenger's.

```
Rank 1:  id=pol_008  fare_class=Top   category=changes
         rrf_score=0.032787  common_tokens=2
         "Top Fare: unlimited changes of date, time, and route without additional fee..."

Rank 2:  id=pol_005  fare_class=Plus  category=changes
         rrf_score=0.032002  common_tokens=2
         "Plus Fare: one change of date or time without additional fee up to 24 hours..."

Rank 3:  id=pol_002  fare_class=Basic category=changes
         rrf_score=0.031498  common_tokens=2
         "Basic Fare: flight changes are not allowed once the booking is confirmed..."
```

**Noise check:**
```
There are documents from other fare_classes in top-3: True
fare_classes in top-3: ['Top', 'Plus', 'Basic']
```

**Consequence:** If an agent uses this result without a filter, they might tell the Basic passenger they "can make changes without a fee" (Top fare information), which is incorrect.

---

## With filter `fare_class='Basic'` (top-3)

With the hard filter applied before any search, the corpus shrinks to 3 documents (pol_001, pol_002, pol_003). The ranking returns only Basic policies.

```
Rank 1:  id=pol_002  fare_class=Basic category=changes
         rrf_score=0.032522  common_tokens=2
         "Basic Fare: flight changes are not allowed once the booking is confirmed.
          Any modification of date, time, or route requires cancellation and new
          purchase at the current price. No refund is possible except for airline-initiated cancellation."

Rank 2:  id=pol_003  fare_class=Basic category=refunds
         rrf_score=0.032522  common_tokens=1
         "Basic Fare: refunds are not available..."

Rank 3:  id=pol_001  fare_class=Basic category=baggage
         rrf_score=0.031746  common_tokens=0
         "Basic Fare: carry-on baggage is included in the price..."
```

**Correctness check:**
```
All results are fare_class='Basic': True
Citable IDs: ['pol_002', 'pol_003', 'pol_001']
```

---

## Citable result

The top-1 with filter is the correct citable source:

```
Source: pol_002 | fare_class: Basic | category: changes
Text: "Basic Fare: flight changes are not allowed once the booking is confirmed.
       Any modification of date, time, or route requires cancellation and new
       purchase at the current price. No refund is possible except for airline-initiated cancellation."
```

An agent with this result can answer with certainty: "With Basic fare, changes without a fee are not possible. Any modification requires canceling and buying again [pol_002, Basic, changes]."

---

## Why the filter changes the result

Without filter:
- pol_008 (Top) ranks first because its text contains "changes" + "without additional fee" — exactly the query terms.
- BM25 and BoW cosine score that document highly.
- The reranker confirms it at top-1.

With filter `fare_class=Basic`:
- pol_008 and pol_005 do not exist for the retriever.
- Only pol_001, pol_002, pol_003 compete.
- pol_002 ranks first because its text contains "changes" (direct query keyword).
- The answer is correct and citable.

**This is the central pattern of the module:** the hard filter is not a stylistic option — it is a deterministic guardrail that prevents the LLM from receiving and using information from the wrong context.
