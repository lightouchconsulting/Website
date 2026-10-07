---
title: "Accelerating Development in the Age of Generative AI"
slug: 2026-04-06-development-insights
theme: Development
subThemes: ["Analysis", "Design", "Validation"]
weekLabel: 2026-W15
date: "2026-04-06"
status: published
sources:
  - title: "Gen AI in the OFSE industry: Progress lags behind intent"
    url: https://www.mckinsey.com/industries/oil-and-gas/our-insights/gen-ai-in-the-ofse-industry-progress-lags-behind-intent
    source: "McKinsey Insights & Publications"
  - title: "The AI revolution in software development"
    url: https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-ai-revolution-in-software-development
    source: "McKinsey Insights & Publications"
  - title: "Arcee's new, open source Trinity-Large-Thinking is the rare, powerful U.S.-made AI model that enterprises can download and customize"
    url: https://venturebeat.com/technology/arcees-new-open-source-trinity-large-thinking-is-the-rare-powerful-u-s-made
    source: "VentureBeat"
  - title: "“I started to lose my ability to code”: Developers grapple with the real cost of AI programming tools"
    url: https://thenewstack.io/ai-coding-tools-reckoning/
    source: "The New Stack"
  - title: "Digital Experience Monitoring belongs in the modern developer workflow"
    url: https://thenewstack.io/digital-experience-monitoring-workflow/
    source: "The New Stack"
---

#Faster Code Isn't Faster Delivery
Most AI coding tools speed up one stage of delivery: writing code. But software moves through many stages, and the slowest one sets the pace. If coding wasn't the slowest, speeding it up may do little for delivery. AI can also change where the slowest stage is, and finding out where it is now means measuring the whole flow.

McKinsey's May 2026 survey of 334 product and engineering leaders shows how uneven the results are. Only 25% of director-level-and-above respondents reported meaningful or top AI acceleration, which McKinsey defines as more than a quarter of their teams achieving twofold or greater productivity gains, and 30% reported that team productivity had fallen. Those are self-reported views, not measurements, which is a reason to measure the flow instead of relying on perception.

##Where the Work Goes Next
When one stage of a pipeline gets much cheaper, the work it produces still has to get through the stages after it. It may queue at the next stage that can't keep pace, or it may have been queuing there already and is now easier to see. If AI doubles the number of pull requests and the number of qualified reviewers stays the same, review becomes the bottleneck.

Security shows the problem clearly. AI makes code cheaper to produce, but the organisation still has to verify it. If security review depends on a small number of specialists, faster generation can lengthen the queue rather than shorten it.

The slowest stage in your pipeline, your constraint, may not be review or security at all. It could be requirements, test environments, release approvals, or a decision that waits on one busy person. Find it first. Then decide the fix: more automation, a change in process or controls, or a different use of the people you already have.

##Who Reviews What AI Writes
Review capacity is one place this shows up. Junior engineers have traditionally learned by doing work that AI now does for them. How do they build the judgement to review what AI produces? CIOs should treat that as a delivery question as well as a people one.

AI can generate the code, but accountability can't be delegated to the model. The person approving a change should be able to explain its architecture, assumptions and risks, ideally in the pull request itself. Juniors also need regular, structured practice at the foundations, not only supervision of generated output.

##What Good Looks Like
Lines of code, licences issued and prompts sent tell you whether tools are being used. They say nothing about whether delivery has improved. McKinsey found that lower-performing organisations leaned disproportionately on adoption figures. Deployment frequency, change failure rate, time to restore service and customer experience are better guides because they measure what reached production and how it behaved.

Quality needs its own measures, since speed gains say little about what shipped. That puts production telemetry and real-user data in the development loop, not only in operations.

##Your Next Step
Begin with a two-week diagnostic of one team and one service. It won't prove anything across the organisation, but it will show where to look.

First, establish a directional baseline. Where available, pull historical data from before AI use became widespread in the team: work tracking, Git history, CI/CD and incident records. If adoption was gradual, treat the history as directional, not a clean control, and don't pretend it proves AI caused any change. Team composition, product mix, major incidents and architecture changes all matter.

Next, map the flow. For each stage from idea to resolution, separate wait time, where work sits in a queue, from touch time, where someone is actively working on it. Tools show elapsed time and state changes well but not effort, so touch time usually needs to be estimated through short team interviews.

Then ask four questions. Has development touch time actually fallen? Has wait time increased elsewhere? Has end-to-end elapsed time improved, and has throughput changed? Has the quality or reliability of what reaches production changed?

Once you've found the constraint, intervene there, measure again, and see whether it moves.

The CIO's part is to sponsor the exercise, ask for evidence rather than adoption figures or developer sentiment, and set the business outcomes it will be judged against, such as time to market, change failure rate or customer experience. Engineering can then choose the operational measures.

The next gains come from the whole system.