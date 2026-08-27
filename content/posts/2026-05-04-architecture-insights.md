---
title: "Architecting for AI-Driven Organisations: The Imperative of Modern Core Technologies"
slug: 2026-05-04-architecture-insights
theme: Architecture
subThemes: ["Application Architecture", "Infrastructure Architecture", "Data Architecture"]
weekLabel: 2026-W19
date: "2026-05-04"
status: published
sources:
  - title: "Can agentic AI (finally) modernize core technologies in insurance?"
    url: https://www.mckinsey.com/industries/financial-services/our-insights/can-agentic-ai-finally-modernize-core-technologies-in-insurance
    source: "McKinsey Insights & Publications"
  - title: "Salesforce launches Agentforce Operations to fix the workflows breaking enterprise AI"
    url: https://venturebeat.com/orchestration/salesforce-launches-agentforce-operations-to-fix-the-workflows-breaking-enterprise-ai
    source: "VentureBeat"
  - title: "Mainframe modernization is no longer optional for the AI-driven enterprise"
    url: https://thenewstack.io/open-mainframe-enterprise-modernization/
    source: "The New Stack"
  - title: "Inside OpenSearch’s bid to become the default AI data layer"
    url: https://thenewstack.io/opensearch-ai-data-layer/
    source: "The New Stack"
  - title: "지식 그래프로 AI 환각 잡는다…러브레이스, LLM 신뢰성 강화 도전"
    url: https://www.cio.com/article/4166322/%ec%a7%80%ec%8b%9d-%ea%b7%b8%eb%9e%98%ed%94%84%eb%a1%9c-ai-%ed%99%98%ea%b0%81-%ec%9e%a1%eb%8a%94%eb%8b%a4%eb%9f%ac%eb%b8%8c%eb%a0%88%ec%9d%b4%ec%8a%a4-llm-%ec%8b%a0%eb%a2%b0%ec%84%b1.html
    source: "전 세계 AI 에이전트 2,800만 개 시대…기업 경쟁력은 ‘인프라’에 달렸다 | CIO"
---

# Architecting for AI-Driven Organisations: Modernising the Enterprise Core for Agentic AI
AI strategy can no longer be separated from the architecture of the enterprise core. Artificial Intelligence and Machine Learning are frequently cited as the drivers of digital transformation — the promise of new insights, operational efficiency, and improved customer experience. But that promise is ultimately constrained by the architecture through which AI accesses data, knowledge and business processes.

## The Constraint: Legacy Architecture Wasn't Built for This
Many organisations are still operating on infrastructure and application architectures that predate today's AI-agent workloads by decades — including mainframes. That doesn't mean this infrastructure is inherently incapable: modern mainframes can expose existing workloads through APIs, and IBM's current Z mainframes include an on-chip AI accelerator (Telum) purpose-built for low-latency inference on live transaction data. The problem is more specific. Many of the application architectures and integration patterns built on top of that infrastructure assume predictable, human-initiated transactions — not agents that plan, act, and revise their own next step in real time.

That distinction matters because agentic workloads need things conventional systems were never asked to provide: persistent state across a multi-step task, fine-grained permissions for what an agent can touch, guardrails on what it can do without approval, a way to verify its output, and a way to recover or compensate cleanly when execution fails. Retrofitting these onto systems designed for single-request, single-response transactions produces a pattern many enterprises now recognise: point-to-point integrations bolted onto ageing cores, data duplicated or replicated to feed models that were never designed to share a common semantic layer — a shared representation of entities, relationships and business meaning that lets data from different systems be interpreted consistently rather than merely retrieved together — and rising operational cost as teams maintain increasingly fragile connective tissue.

## A Control Plane, Not a Single Layer
The market's response to this isn't one new architectural layer — it's several distinct capabilities, often confused with one another:

- **Foundation** — the systems of record, data platforms, APIs and identity services that already exist, and what they can expose without wholesale replacement.
- **Context** — search and retrieval infrastructure, semantic models, and knowledge graphs that give AI access to enterprise knowledge as entities and relationships, not just similar-sounding text.
- **Intelligence** — the underlying models, large or small, and decisions about where inference runs, how it's routed, and at what cost.
- **Agentic control** — how AI agents plan, maintain state, select tools, coordinate with each other, and hand off work. This is distinct from business-process orchestration, which coordinates tasks across people, teams, and agents alike — a different problem that's easy to conflate with it.
- **Execution** — where decisions become action: the APIs, transactions and workflows an agent actually touches.

Governance and security cut across all five of these rather than sitting downstream of them — identity and access decisions apply to what an agent can retrieve, which model can see which data, what an API call is permitted to do, and how a decision gets audited afterwards. Treating governance as a final checkpoint rather than a property of every layer is one of the more common design mistakes.

Two commonly cited examples sit in different parts of this picture, and it's worth being precise about which is which. Salesforce's Agentforce Operations — the former Regrello platform, acquired by Salesforce and relaunched in April 2026 — turns a business process into a "blueprint," then assigns the resulting tasks to people, teams, or AI agents. That's business-process orchestration and execution: tightly coupled to the Salesforce ecosystem, though it orchestrates work across external systems too, and aimed at back-office processes including invoice auditing and onboarding.

OpenSearch sits at the context layer instead. Originally forked from Elasticsearch in 2021 and now a Linux Foundation project, it has spent the past few years extending from conventional search and log analytics into vector search and agent-oriented retrieval. It's one of several options in that category — alongside vector databases, data warehouses, and other search engines — not a default answer in itself. And vector retrieval only goes so far: it finds content that's semantically similar, but it doesn't inherently model enterprise relationships, temporal state, or the business semantics and authorisation rules governing access.

Conflating a vendor-specific execution product with a piece of open retrieval infrastructure is exactly how "AI architecture" conversations get muddled, and it's a large part of why organisations end up buying point solutions instead of designing a coherent control plane around their existing core.

## Closing the Trust Gap: Evidence, Not Just Answers
Separate from infrastructure is a trust problem: AI systems that produce conclusions without a traceable evidence trail tend to generate scepticism among the people who have to act on them, particularly in regulated or high-stakes decisions.

Retrieval-augmented generation answers the question "what information looks relevant?" A semantic or graph layer can additionally answer which entities are connected, what those relationships mean, and which facts are valid in a given context — which is why the two are increasingly used together rather than as alternatives.

Knowledge graphs are one useful response to that gap — not because they expose a model's internal reasoning (they don't), but because they can expose the evidence, entities and relationships that informed a conclusion: which records were available to the decision, which were retrieved, and how the relevant entities relate to one another. Neo4j, for example, has published guidance on grounding Salesforce's Agentforce agents in a company knowledge graph, giving agents visibility into relationships — subsidiaries, suppliers, competitors — that sit outside core CRM records. Stardog and Amazon Neptune provide other approaches to graph-based enterprise knowledge.

A graph is only as trustworthy as the data behind it, though. An incomplete, stale, or poorly reconciled graph can produce false confidence just as easily as a language model can hallucinate — which is why provenance, data freshness, and a defined way to handle conflicting sources matter as much as the graph structure itself.

## Bounded Autonomy
None of this settles the more basic governance question underneath it: who decides what an agent is allowed to do without asking first? A workable pattern separates an agent's judgement from its authority to act — it can gather evidence and propose a decision, but a policy layer determines what it's permitted to do unsupervised, and a workflow layer executes the action and records the outcome for audit.

It also isn't a case for making every process agentic. Deterministic workflows, rules engines, conventional automation and human judgement remain the right tool for plenty of enterprise decisions. The more useful question isn't which processes to hand to agents — it's where probabilistic reasoning genuinely adds value, and where deterministic controls need to stay in place around the actions that require certainty.

Where agents are the right tool, the controls above only hold up alongside ongoing evaluation. Agent behaviour can change as data, prompts, models and downstream systems change, so the goal is to catch degraded or unreliable behaviour before it affects a customer, transaction or regulated decision — not just at launch. Give agents better data and they'll be more reliable. That's necessary. It isn't sufficient on its own.

## Your Next Step
For a CIO, the task is to treat this as one architecture, not a set of unrelated procurement decisions:

1. **Foundation** — can our systems expose reliable, timely data through APIs and events without wholesale replacement?
2. **Context** — can AI reach the right enterprise knowledge, relationships and evidence, not just semantically similar text?
3. **Agency** — can agents plan, coordinate and act within boundaries we've actually defined, rather than ones a vendor assumed for us — and only where that's genuinely the right tool for the process?
4. **Governance** — can we prove what an agent saw, decided, was authorised to do, and actually did, across every layer it touched — and will we notice if that behaviour starts to drift?

Assess these separately with the teams who own each one. The objective isn't to replace the core with an AI platform — it's to make the core, context, agents and execution work as one governed system.