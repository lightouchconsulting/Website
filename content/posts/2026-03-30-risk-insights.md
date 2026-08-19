---
title: "Navigating the Uncharted Risks of Agentic AI in the Enterprise"
slug: 2026-03-30-risk-insights
theme: Risk
subThemes: ["Threat & Vulnerability", "Cybersecurity", "Access Control & IAM"]
weekLabel: 2026-W14
date: "2026-03-30"
status: published
sources:
  - title: "Securing the agentic enterprise: Opportunities for cybersecurity providers"
    url: https://www.mckinsey.com/capabilities/risk-and-resilience/our-insights/securing-the-agentic-enterprise-opportunities-for-cybersecurity-providers
    source: "McKinsey Insights & Publications"
  - title: "96% of codebases rely on open source, and AI slop is putting them at risk"
    url: https://thenewstack.io/ai-slop-open-source/
    source: "The New Stack"
  - title: "Nvidia’s NemoClaw has three layers of agent security. None of them solve the real problem."
    url: https://thenewstack.io/nvidia-nemoclaw-openclaw-security/
    source: "The New Stack"
  - title: "Spotting and Avoiding ROT in Your Agentic AI"
    url: https://www.oreilly.com/radar/spotting-and-avoiding-rot-in-your-agentic-ai/
    source: "Radar"
  - title: "10 cosas que quitan el sueño a los responsables de TI"
    url: https://www.cio.com/article/4151680/10-cosas-que-quitan-el-sueno-a-los-responsables-de-ti.html
    source: "The AI revolution: Getting culture right for AI success | CIO"
---

# Navigating the Uncharted Risks of Agentic AI in the Enterprise

Agentic AI is moving from experimentation into enterprise workflows, giving AI systems the ability not only to generate information but to interpret context, use tools, access data, and take actions. For CIOs, this represents a fundamental shift in the security model. The question is no longer simply whether an AI model can be manipulated. It is what an agent can do if it is manipulated, and whether the organisation can detect and contain the consequences.

Traditional cybersecurity controls remain essential, but they were not designed around software that can dynamically interpret information and initiate actions across multiple systems. Organisations that deploy agents without reassessing permissions, trust boundaries and monitoring risk creating new attack paths that existing controls may not adequately address.

## The New Attack Surface

The core risk of agentic AI comes from the combination of reasoning capability and operational authority. An agent may consume information from an email, document, website or database, interpret that information, select a tool and then act on the resulting decision. An attacker may therefore not need to compromise the underlying AI model. They may instead attempt to manipulate information the agent is expected to consume.

Indirect prompt injection, or agent hijacking, is one example. Malicious instructions embedded in otherwise legitimate content can potentially influence an agent's behaviour and cause it to take unintended actions. The consequences depend heavily on the permissions surrounding the agent.

An agent with read-only access to a limited dataset presents one level of risk. An agent capable of modifying production systems, accessing sensitive information, sending external communications, or executing financial transactions presents another entirely.

This makes least privilege critical. Organisations should treat every agent as an identity with defined capabilities, rather than simply as an AI application. CIOs need to understand what each agent can see, what it can do, which systems it can influence, and what happens if its instructions or context are compromised.

## From AI Output to AI Action

The risks extend beyond prompt injection. Agentic systems can introduce excessive permissions, unsafe tool use, credential misuse, data leakage, compromised dependencies, and insufficient visibility into automated decisions. A sequence of individually reasonable actions can also produce an outcome that was never explicitly intended.

This distinction is particularly important when AI is used in software development. AI coding assistants can introduce vulnerabilities into generated code, but autonomous coding agents introduce an additional layer of risk because they may be able to inspect repositories, modify files, install dependencies, execute commands, and participate in deployment workflows.

These are related but different security problems. AI-generated code requires robust software assurance, including code review, security testing, dependency scanning and CI/CD controls. Autonomous coding agents additionally require controls around identity, permissions, tool access and execution authority.

The objective should not be to prevent AI-generated code or agentic development. It should be to ensure that increased development velocity does not bypass established security controls.

## What Good Looks Like

Leading organisations will treat agent security as an extension of established cybersecurity disciplines rather than as a completely separate problem. Every production agent should have a clearly accountable owner, defined permissions, controlled access to tools and data, and appropriate monitoring.

High-impact actions should have additional safeguards. An agent that drafts an email does not require the same controls as one that can send it. An agent that analyses production infrastructure does not necessarily need permission to change it. Actions involving financial transactions, privileged access, sensitive data, production systems, or irreversible changes should have appropriate human approval or policy-based controls.

Testing also needs to evolve. Organisations should test agents against indirect prompt injection, malicious documents and web content, attempts to exceed authorised permissions, unsafe tool calls, and other realistic adversarial scenarios. Monitoring should capture meaningful information about agent activity, including tool calls, data access and consequential actions, so that security teams can investigate what happened when something goes wrong.

Governance must extend across the agent lifecycle. Changes to models, prompts, tools, permissions and integrations can materially change the security profile of an agent and should therefore trigger appropriate review.

## Your Next Step

If your organisation is already deploying agents, start by creating an inventory of current and planned deployments. For each agent, document what it can see, what it can do, which credentials it possesses, which tools it can invoke, what external information can influence it, and which actions require human approval.

Then assess the consequences of compromise. If an attacker successfully manipulated the agent, what could it access, change, disclose, or initiate? Can its credentials be revoked immediately? Can its actions be reconstructed from logs? Are there meaningful controls between the agent and high-impact systems?

The objective is not to eliminate autonomy. It is to make autonomy governable.

Agentic AI can deliver significant productivity and operational benefits, but its security cannot depend on the assumption that the AI will always behave as intended. The more authority an organisation gives an agent, the more important it becomes to constrain that authority, validate its actions, and maintain effective oversight.

The central principle is simple: **the security risk of an AI agent is determined not only by what the model can generate, but by what the surrounding system allows the agent to do.**
